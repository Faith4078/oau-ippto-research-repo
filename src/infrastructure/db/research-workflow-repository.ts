import { eq } from "drizzle-orm";
import { createInitialResearchSubmissionState } from "#/application/research-submission-state.ts";
import type {
	ResearchSubmissionDraft,
	ResearchWorkflowRepository,
} from "#/application/research-workflow.ts";
import type {
	EntityId,
	RepositoryFile,
	ResearchRecord,
} from "#/domain/index.ts";
import type {
	ResearchRecordUpdateInput,
	ResearchSubmissionInput,
	SignedUploadRequest,
} from "#/lib/validation.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class DrizzleResearchWorkflowRepository
	implements ResearchWorkflowRepository
{
	constructor(private readonly database: Database) {}

	async createSubmissionDraft(
		input: ResearchSubmissionInput & { ownerId: EntityId },
	): Promise<ResearchSubmissionDraft> {
		const initialState = createInitialResearchSubmissionState(
			input.requiresIpttoReview,
			input.accessLevel,
		);
		const [record] = await this.database
			.insert(schema.researchRecords)
			.values({
				title: input.title,
				slug: createSlug(input.title),
				abstract: input.abstract,
				status: initialState.status,
				accessLevel: input.accessLevel,
				facultyId: input.facultyId,
				departmentId: input.departmentId,
				ownerId: input.ownerId,
				researchArea: input.researchArea ?? null,
				startedOn: input.startedOn ?? null,
				completedOn: input.completedOn ?? null,
				publishedAt: initialState.publishedAt,
				commercializationStatus: input.commercializationStatus ?? null,
				fundingInfo: input.fundingInfo ?? null,
				comment: input.comment ?? null,
				metadata: initialState.metadata,
			})
			.returning({
				id: schema.researchRecords.id,
				status: schema.researchRecords.status,
			});

		if (!record) {
			throw new Error("Research submission could not be created.");
		}

		await this.insertAuthors(record.id, input.authors);
		await this.insertKeywords(record.id, input.keywords);
		await this.insertPublication(record.id, input.publication);

		return {
			id: record.id,
			status: record.status,
		};
	}

	async findResearchRecordById(id: EntityId): Promise<ResearchRecord | null> {
		const [record] = await this.database
			.select()
			.from(schema.researchRecords)
			.where(eq(schema.researchRecords.id, id));

		return record ? mapResearchRecord(record) : null;
	}

	async findFileById(id: EntityId): Promise<RepositoryFile | null> {
		const [file] = await this.database
			.select()
			.from(schema.files)
			.where(eq(schema.files.id, id));

		return file ? mapRepositoryFile(file) : null;
	}

	async updateResearchStatus(
		id: EntityId,
		status: ResearchRecord["status"],
	): Promise<ResearchRecord> {
		const [record] = await this.database
			.update(schema.researchRecords)
			.set({
				status,
				publishedAt: status === "published" ? new Date() : undefined,
				updatedAt: new Date(),
			})
			.where(eq(schema.researchRecords.id, id))
			.returning();

		if (!record) {
			throw new Error("Research record could not be updated.");
		}

		return mapResearchRecord(record);
	}

	async updateResearchRecord(
		id: EntityId,
		input: ResearchRecordUpdateInput,
	): Promise<ResearchRecord | null> {
		const values = removeUndefined({
			title: input.title,
			slug: input.title ? createSlug(input.title) : undefined,
			abstract: input.abstract,
			accessLevel: input.accessLevel,
			facultyId: input.facultyId,
			departmentId: input.departmentId,
			researchArea: input.researchArea,
			startedOn: input.startedOn,
			completedOn: input.completedOn,
			commercializationStatus: input.commercializationStatus,
			fundingInfo: input.fundingInfo,
			comment: input.comment,
			updatedAt: new Date(),
		});

		const [record] = await this.database
			.update(schema.researchRecords)
			.set(values)
			.where(eq(schema.researchRecords.id, id))
			.returning();

		if (!record) {
			return null;
		}

		if (input.authors) {
			await this.database
				.delete(schema.researchAuthors)
				.where(eq(schema.researchAuthors.researchRecordId, id));
			await this.insertAuthors(id, input.authors);
		}

		if (input.keywords) {
			await this.database
				.delete(schema.researchKeywords)
				.where(eq(schema.researchKeywords.researchRecordId, id));
			await this.insertKeywords(id, input.keywords);
		}

		if (input.publication) {
			await this.database
				.delete(schema.publications)
				.where(eq(schema.publications.researchRecordId, id));
			await this.insertPublication(id, input.publication);
		}

		return mapResearchRecord(record);
	}

	async attachUploadedFileMetadata(
		input: SignedUploadRequest & {
			objectKey: string;
			uploaderId: EntityId;
		},
	): Promise<RepositoryFile> {
		const [file] = await this.database
			.insert(schema.files)
			.values({
				objectKey: input.objectKey,
				bucket: process.env.R2_BUCKET_NAME ?? "repository-files",
				filename: input.file.filename,
				mimeType: input.file.mimeType,
				fileSizeBytes: input.file.fileSizeBytes,
				checksum: input.file.checksum ?? null,
				accessLevel: input.file.accessLevel,
				purpose: input.file.purpose,
				uploaderId: input.uploaderId,
				researchRecordId: input.researchRecordId ?? null,
				metadata: {
					confirmedAt: new Date().toISOString(),
				},
			})
			.returning();

		if (!file) {
			throw new Error("Uploaded file metadata could not be saved.");
		}

		return mapRepositoryFile(file);
	}

	private async insertAuthors(
		researchRecordId: EntityId,
		authors: ResearchSubmissionInput["authors"],
	) {
		for (const [position, author] of authors.entries()) {
			const [createdAuthor] = await this.database
				.insert(schema.authors)
				.values({
					userId: author.userId ?? null,
					name: author.name,
					email: author.email ?? null,
					affiliation: author.affiliation ?? null,
					orcid: author.orcid ?? null,
				})
				.returning({ id: schema.authors.id });

			if (createdAuthor) {
				await this.database.insert(schema.researchAuthors).values({
					researchRecordId,
					authorId: createdAuthor.id,
					position,
					isCorresponding: author.isCorresponding,
					contribution: author.contribution ?? null,
				});
			}
		}
	}

	private async insertKeywords(researchRecordId: EntityId, keywords: string[]) {
		for (const value of keywords) {
			const [keyword] = await this.database
				.insert(schema.keywords)
				.values({ value })
				.onConflictDoUpdate({
					target: schema.keywords.value,
					set: { value },
				})
				.returning({ id: schema.keywords.id });

			if (keyword) {
				await this.database
					.insert(schema.researchKeywords)
					.values({
						researchRecordId,
						keywordId: keyword.id,
					})
					.onConflictDoNothing();
			}
		}
	}

	private async insertPublication(
		researchRecordId: EntityId,
		publication: ResearchSubmissionInput["publication"],
	) {
		await this.database.insert(schema.publications).values({
			researchRecordId,
			title: publication.title,
			type: publication.type,
			publisher: publication.publisher,
			journal: publication.journal,
			volume: publication.volume,
			issue: publication.issue,
			pages: publication.pages,
			doi: publication.doi,
			isbn: publication.isbn,
			url: publication.url ?? null,
			publishedOn: publication.publishedOn ?? null,
			citation: publication.citation ?? null,
		});
	}
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
	return Object.fromEntries(
		Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
	) as Partial<T>;
}

function createSlug(title: string): string {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 480);

	return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapResearchRecord(
	record: typeof schema.researchRecords.$inferSelect,
): ResearchRecord {
	return {
		id: record.id,
		title: record.title,
		slug: record.slug,
		abstract: record.abstract,
		status: record.status,
		accessLevel: record.accessLevel,
		facultyId: record.facultyId,
		departmentId: record.departmentId,
		ownerId: record.ownerId,
		researchArea: record.researchArea,
		startedOn: record.startedOn,
		completedOn: record.completedOn,
		publishedAt: record.publishedAt,
		commercializationStatus: record.commercializationStatus,
		fundingInfo: record.fundingInfo,
		comment: record.comment,
		metadata: record.metadata,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

function mapRepositoryFile(
	file: typeof schema.files.$inferSelect,
): RepositoryFile {
	return {
		id: file.id,
		objectKey: file.objectKey,
		bucket: file.bucket,
		filename: file.filename,
		mimeType: file.mimeType,
		fileSizeBytes: file.fileSizeBytes,
		checksum: file.checksum,
		accessLevel: file.accessLevel,
		purpose: file.purpose,
		uploaderId: file.uploaderId,
		researchRecordId: file.researchRecordId,
		publicationId: file.publicationId,
		metadata: file.metadata,
		createdAt: file.createdAt,
		updatedAt: file.updatedAt,
	};
}
