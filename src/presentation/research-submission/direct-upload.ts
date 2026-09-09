import type { ResearchSubmissionDraft } from "#/application/research-workflow.ts";
import type { RepositoryFile, ResearchRecord } from "#/domain/index.ts";
import {
	type ResearchRecordUpdateInput,
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
	commercializationStatus: string;
	fundingInfo: string;
	comment: string;
	imageChecksum: string;
};

export type ResearchSubmissionUpload = {
	file: File;
	image?: File | null;
	values: ResearchSubmissionFormValues;
};

export type ResearchSubmissionUpdate = {
	researchRecordId: string;
	file?: File | null;
	image?: File | null;
	values: ResearchSubmissionFormValues;
};

export type DirectUploadResult = {
	submission: ResearchSubmissionDraft;
	files: RepositoryFile[];
};

export type DirectUpdateResult = {
	submission: ResearchRecord;
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

function buildResearchRecordFields(values: ResearchSubmissionFormValues) {
	return {
		title: values.title,
		abstract: values.abstract,
		authors: parseAuthors(values.authorsText),
		departmentId: values.departmentId,
		facultyId: values.facultyId,
		keywords: splitList(values.keywordsText),
		publication: {
			type: values.publicationType,
			title: values.publicationTitle || values.title,
			publisher: values.publisher,
			journal: values.journal,
			volume: values.volume,
			issue: values.issue,
			pages: values.pages,
			doi: values.doi,
			isbn: values.isbn,
			url: emptyToNull(values.url),
			publishedOn: emptyToNull(values.publishedOn),
			citation: emptyToNull(values.citation),
		},
		accessLevel: values.accessLevel,
		researchArea: emptyToNull(values.researchArea),
		startedOn: emptyToNull(values.startedOn),
		completedOn: emptyToNull(values.completedOn),
		requiresIpttoReview: values.requiresIpttoReview,
		commercializationStatus: emptyToNull(values.commercializationStatus),
		fundingInfo: emptyToNull(values.fundingInfo),
		comment: emptyToNull(values.comment),
	};
}

export function buildResearchSubmissionPayload(
	input: ResearchSubmissionUpload,
): ResearchSubmissionInput {
	const fileMetadata = buildResearchFileMetadata(input);
	const filesMetadata = [fileMetadata];

	if (input.image) {
		filesMetadata.push(buildResearchImageMetadata(input));
	}

	return researchSubmissionInputSchema.parse({
		...buildResearchRecordFields(input.values),
		files: filesMetadata,
	});
}

export function buildResearchUpdatePayload(
	values: ResearchSubmissionFormValues,
): ResearchRecordUpdateInput {
	return researchSubmissionInputSchema
		.omit({ files: true })
		.parse(buildResearchRecordFields(values));
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

export function buildResearchImageMetadata(
	input: ResearchSubmissionUpload,
): SignedUploadRequest["file"] {
	if (!input.image) {
		throw new Error("No research image was provided.");
	}

	return {
		filename: input.image.name,
		mimeType: input.image.type || "application/octet-stream",
		fileSizeBytes: input.image.size,
		checksum: emptyToNull(input.values.imageChecksum),
		accessLevel: input.values.accessLevel,
		purpose: "research_image",
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

	const files: RepositoryFile[] = [];

	try {
		files.push(
			await uploadResearchFile({
				researchRecordId: submission.id,
				file: input.file,
				metadata: buildResearchFileMetadata(input),
				fetcher,
			}),
		);

		if (input.image) {
			files.push(
				await uploadResearchFile({
					researchRecordId: submission.id,
					file: input.image,
					metadata: buildResearchImageMetadata(input),
					fetcher,
				}),
			);
		}
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "The document could not be attached.";

		throw new ResearchSubmissionUploadError(message, submission);
	}

	return {
		submission,
		files,
	};
}

export async function updateResearchWithDirectUpload(
	input: ResearchSubmissionUpdate,
	fetcher: Fetcher = fetch,
): Promise<DirectUpdateResult> {
	const updatePayload = buildResearchUpdatePayload(input.values);
	const submission = await patchJson<ResearchRecord>(
		`/api/research/submissions/${input.researchRecordId}`,
		updatePayload,
		fetcher,
	);

	const files: RepositoryFile[] = [];

	try {
		if (input.file) {
			files.push(
				await uploadResearchFile({
					researchRecordId: input.researchRecordId,
					file: input.file,
					metadata: buildResearchFileMetadata({
						file: input.file,
						values: input.values,
					}),
					fetcher,
				}),
			);
		}

		if (input.image) {
			files.push(
				await uploadResearchFile({
					researchRecordId: input.researchRecordId,
					file: input.image,
					metadata: buildResearchImageMetadata({
						file: input.image,
						image: input.image,
						values: input.values,
					}),
					fetcher,
				}),
			);
		}
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "The document could not be attached.";

		throw new ResearchSubmissionUploadError(message, submission);
	}

	return {
		submission,
		files,
	};
}

async function uploadResearchFile(input: {
	researchRecordId: string;
	file: File;
	metadata: SignedUploadRequest["file"];
	fetcher: Fetcher;
}): Promise<RepositoryFile> {
	const signedUpload = await postJson<SignedUrlResponse>(
		"/api/files/signed-upload-url",
		{
			researchRecordId: input.researchRecordId,
			file: input.metadata,
		},
		input.fetcher,
	);

	await uploadFileToR2(input.file, signedUpload, input.fetcher);

	return postJson<RepositoryFile>(
		"/api/files/confirm-upload",
		{
			researchRecordId: input.researchRecordId,
			file: input.metadata,
			objectKey: signedUpload.objectKey,
		},
		input.fetcher,
	);
}

async function postJson<T>(
	url: string,
	payload: unknown,
	fetcher: Fetcher,
): Promise<T> {
	return requestJson<T>(url, "POST", payload, fetcher);
}

async function patchJson<T>(
	url: string,
	payload: unknown,
	fetcher: Fetcher,
): Promise<T> {
	return requestJson<T>(url, "PATCH", payload, fetcher);
}

async function requestJson<T>(
	url: string,
	method: "POST" | "PATCH",
	payload: unknown,
	fetcher: Fetcher,
): Promise<T> {
	const response = await fetcher(url, {
		method,
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
		throw new Error("The document could not be attached. Please try again.");
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
