import type { ResearchSubmissionDraft } from "#/application/research-workflow.ts";
import type { RepositoryFile } from "#/domain/index.ts";
import {
	type ResearchSubmissionInput,
	researchSubmissionInputSchema,
	type SignedUploadRequest,
} from "#/lib/validation.ts";

export type ResearchSubmissionFormValues = {
	title: string;
	abstract: string;
	authorsText: string;
	departmentId: string;
	facultyId: string;
	keywordsText: string;
	publicationType: ResearchSubmissionInput["publication"]["type"];
	publicationTitle: string;
	publisher: string;
	journal: string;
	volume: string;
	issue: string;
	pages: string;
	doi: string;
	isbn: string;
	url: string;
	publishedOn: string;
	citation: string;
	accessLevel: ResearchSubmissionInput["accessLevel"];
	researchArea: string;
	startedOn: string;
	completedOn: string;
	requiresIpttoReview: boolean;
	fileChecksum: string;
};

export type ResearchSubmissionUpload = {
	file: File;
	values: ResearchSubmissionFormValues;
};

export type DirectUploadResult = {
	submission: ResearchSubmissionDraft;
	files: RepositoryFile[];
};

export class ResearchSubmissionUploadError extends Error {
	constructor(
		message: string,
		readonly submission: ResearchSubmissionDraft,
	) {
		super(message);
		this.name = "ResearchSubmissionUploadError";
	}
}

type ApiError = {
	error?: {
		message?: string;
		code?: string;
	};
};

type ApiSuccess<T> = {
	data: T;
};

type Fetcher = typeof fetch;

type SignedUrlResponse = {
	url: string;
	method: "PUT";
	expiresAt: string | Date;
	headers?: Record<string, string>;
	objectKey: string;
};

export function buildResearchSubmissionPayload(
	input: ResearchSubmissionUpload,
): ResearchSubmissionInput {
	const fileMetadata = buildResearchFileMetadata(input);
	const payload = {
		title: input.values.title,
		abstract: input.values.abstract,
		authors: parseAuthors(input.values.authorsText),
		departmentId: input.values.departmentId,
		facultyId: input.values.facultyId,
		keywords: splitList(input.values.keywordsText),
		publication: {
			type: input.values.publicationType,
			title: input.values.publicationTitle || input.values.title,
			publisher: input.values.publisher,
			journal: input.values.journal,
			volume: input.values.volume,
			issue: input.values.issue,
			pages: input.values.pages,
			doi: input.values.doi,
			isbn: input.values.isbn,
			url: emptyToNull(input.values.url),
			publishedOn: emptyToNull(input.values.publishedOn),
			citation: emptyToNull(input.values.citation),
		},
		accessLevel: input.values.accessLevel,
		files: [fileMetadata],
		researchArea: emptyToNull(input.values.researchArea),
		startedOn: emptyToNull(input.values.startedOn),
		completedOn: emptyToNull(input.values.completedOn),
		requiresIpttoReview: input.values.requiresIpttoReview,
	};

	return researchSubmissionInputSchema.parse(payload);
}

export function buildResearchFileMetadata(
	input: ResearchSubmissionUpload,
): SignedUploadRequest["file"] {
	return {
		filename: input.file.name,
		mimeType: input.file.type || "application/octet-stream",
		fileSizeBytes: input.file.size,
		checksum: emptyToNull(input.values.fileChecksum),
		accessLevel: input.values.accessLevel,
		purpose: "research_document",
	};
}

export async function submitResearchWithDirectUpload(
	input: ResearchSubmissionUpload,
	fetcher: Fetcher = fetch,
): Promise<DirectUploadResult> {
	const submissionPayload = buildResearchSubmissionPayload(input);
	const submission = await postJson<ResearchSubmissionDraft>(
		"/api/research/submissions",
		submissionPayload,
		fetcher,
	);

	let file: RepositoryFile;

	try {
		const fileMetadata = buildResearchFileMetadata(input);
		const signedUpload = await postJson<SignedUrlResponse>(
			"/api/files/signed-upload-url",
			{
				researchRecordId: submission.id,
				file: fileMetadata,
			},
			fetcher,
		);

		await uploadFileToR2(input.file, signedUpload, fetcher);

		file = await postJson<RepositoryFile>(
			"/api/files/confirm-upload",
			{
				researchRecordId: submission.id,
				file: fileMetadata,
				objectKey: signedUpload.objectKey,
			},
			fetcher,
		);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "The file upload could not be completed.";

		throw new ResearchSubmissionUploadError(message, submission);
	}

	return {
		submission,
		files: [file],
	};
}

async function postJson<T>(
	url: string,
	payload: unknown,
	fetcher: Fetcher,
): Promise<T> {
	const response = await fetcher(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const body = (await response.json().catch(() => ({}))) as
		| ApiSuccess<T>
		| ApiError;

	if (!response.ok || !("data" in body)) {
		let message = "The request could not be completed.";

		const apiError = "error" in body ? body.error : null;

		if (apiError?.message) {
			message = apiError.message;
		}

		throw new Error(message);
	}

	return body.data;
}

async function uploadFileToR2(
	file: File,
	signedUpload: SignedUrlResponse,
	fetcher: Fetcher,
) {
	const response = await fetcher(signedUpload.url, {
		method: signedUpload.method,
		headers: signedUpload.headers ?? {},
		body: file,
	});

	if (!response.ok) {
		throw new Error("The file could not be uploaded to Cloudflare R2.");
	}
}

function parseAuthors(value: string): ResearchSubmissionInput["authors"] {
	return splitLines(value).map((line, index) => {
		const match = line.match(/^(?<name>.+?)\s*<(?<email>[^>]+)>$/);

		return {
			name: match?.groups?.name?.trim() || line,
			email: match?.groups?.email?.trim() || null,
			isCorresponding: index === 0,
		};
	});
}

function splitList(value: string): string[] {
	return value
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function splitLines(value: string): string[] {
	return value
		.split(/\n/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function emptyToNull(value: string): string | null {
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}
