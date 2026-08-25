import { describe, expect, it } from "vitest";

import {
	type ObjectStorageSigner,
	type ResearchWorkflowAuditRepository,
	type ResearchWorkflowRepository,
	createResearchWorkflowService,
} from "../../src/application/research-workflow.ts";
import type { AuthenticatedActor } from "../../src/application/authorization.ts";
import type {
	ApprovalHistoryEntry,
	EntityId,
	RepositoryFile,
	ResearchRecord,
} from "../../src/domain/index.ts";
import type {
	ResearchSubmissionInput,
	SignedUploadRequest,
} from "../../src/lib/validation.ts";

const ownerId = "00000000-0000-4000-8000-000000000001";
const reviewerId = "00000000-0000-4000-8000-000000000002";
const outsiderId = "00000000-0000-4000-8000-000000000003";
const facultyId = "00000000-0000-4000-8000-000000000011";
const departmentId = "00000000-0000-4000-8000-000000000012";
const researchRecordId = "00000000-0000-4000-8000-000000000021";
const fileId = "00000000-0000-4000-8000-000000000031";

const lecturer: AuthenticatedActor = {
	status: "active",
	userId: ownerId,
	roles: [{ role: "lecturer" }],
};

const departmentReviewer: AuthenticatedActor = {
	status: "active",
	userId: reviewerId,
	roles: [{ role: "department_administrator", facultyId, departmentId }],
};

const facultyReviewer: AuthenticatedActor = {
	status: "active",
	userId: reviewerId,
	roles: [{ role: "faculty_administrator", facultyId }],
};

const outsiderLecturer: AuthenticatedActor = {
	status: "active",
	userId: outsiderId,
	roles: [{ role: "lecturer" }],
};

describe("research workflow integration with service doubles", () => {
	it("creates a validated research submission and writes an audit log", async () => {
		const repository = new InMemoryResearchWorkflowRepository();
		const auditRepository = new InMemoryWorkflowAuditRepository();
		const service = createResearchWorkflowService({
			auditRepository,
			researchRepository: repository,
			storageSigner: new InMemoryStorageSigner(),
		});

		const result = await service.createSubmission(lecturer, submissionPayload(), {
			ipAddress: "127.0.0.1",
			userAgent: "vitest",
		});

		expect(result, result.ok ? undefined : result.error.message).toMatchObject({
			ok: true,
		});
		expect(result.ok ? result.value.status : null).toBe("submitted");
		expect(repository.records).toHaveLength(1);
		expect(repository.records[0]?.ownerId).toBe(ownerId);
		expect(auditRepository.auditLogs).toContainEqual(
			expect.objectContaining({
				action: "research.submission.created",
				actorId: ownerId,
				ipAddress: "127.0.0.1",
				targetId: researchRecordId,
			}),
		);
	});

	it("rejects invalid submission payloads before repository writes", async () => {
		const repository = new InMemoryResearchWorkflowRepository();
		const service = createResearchWorkflowService({
			auditRepository: new InMemoryWorkflowAuditRepository(),
			researchRepository: repository,
			storageSigner: new InMemoryStorageSigner(),
		});

		const result = await service.createSubmission(lecturer, {
			...submissionPayload(),
			abstract: "Too short",
		});

		expect(result).toMatchObject({
			ok: false,
			error: { code: "VALIDATION_FAILED" },
		});
		expect(repository.records).toHaveLength(0);
	});

	it("persists uploaded file metadata only after upload confirmation", async () => {
		const repository = new InMemoryResearchWorkflowRepository();
		const auditRepository = new InMemoryWorkflowAuditRepository();
		const storageSigner = new InMemoryStorageSigner();
		const service = createResearchWorkflowService({
			auditRepository,
			researchRepository: repository,
			storageSigner,
		});
		const uploadRequest = signedUploadPayload();

		const signedUrl = await service.createSignedUploadUrl(
			lecturer,
			uploadRequest,
		);

		expect(signedUrl.ok).toBe(true);
		expect(repository.files).toHaveLength(0);

		const confirmed = await service.confirmUploadedFile(
			lecturer,
			uploadRequest,
			signedUrl.ok ? signedUrl.value.objectKey : "missing",
		);

		expect(confirmed.ok).toBe(true);
		expect(repository.files).toHaveLength(1);
		expect(repository.files[0]).toMatchObject({
			filename: "repository-output.pdf",
			objectKey: storageSigner.lastUploadObjectKey,
			uploaderId: ownerId,
		});
	});

	it("allows scoped reviewers to transition department review records", async () => {
		const repository = new InMemoryResearchWorkflowRepository([
			researchRecord({ status: "department_review" }),
		]);
		const auditRepository = new InMemoryWorkflowAuditRepository();
		const service = createResearchWorkflowService({
			auditRepository,
			researchRepository: repository,
			storageSigner: new InMemoryStorageSigner(),
		});

		const result = await service.transitionApproval(departmentReviewer, {
			decision: "approve",
			fromStatus: "department_review",
			researchRecordId,
			toStatus: "faculty_review",
			requiresIpttoReview: false,
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.status : null).toBe("faculty_review");
		expect(auditRepository.approvalHistory).toContainEqual(
			expect.objectContaining({
				action: "approved",
				actorId: reviewerId,
				fromStatus: "department_review",
				toStatus: "faculty_review",
			}),
		);
	});

	it("does not let a browser bypass a required IPTTO review", async () => {
		const repository = new InMemoryResearchWorkflowRepository([
			researchRecord({
				metadata: { requiresIpttoReview: true },
				status: "faculty_review",
			}),
		]);
		const service = createResearchWorkflowService({
			auditRepository: new InMemoryWorkflowAuditRepository(),
			researchRepository: repository,
			storageSigner: new InMemoryStorageSigner(),
		});

		const result = await service.transitionApproval(facultyReviewer, {
			decision: "approve",
			fromStatus: "faculty_review",
			researchRecordId,
			toStatus: "approved",
			requiresIpttoReview: false,
		});

		expect(result).toMatchObject({
			ok: false,
			error: { code: "INVALID_APPROVAL_TRANSITION" },
		});
		expect(repository.records[0]?.status).toBe("faculty_review");
	});

	it("blocks private signed downloads for actors outside the research scope", async () => {
		const repository = new InMemoryResearchWorkflowRepository([
			researchRecord({ accessLevel: "private" }),
		]);
		repository.files.push(repositoryFile({ accessLevel: "private" }));
		const service = createResearchWorkflowService({
			auditRepository: new InMemoryWorkflowAuditRepository(),
			researchRepository: repository,
			storageSigner: new InMemoryStorageSigner(),
		});

		const result = await service.createSignedDownloadUrl(outsiderLecturer, {
			fileId,
			researchRecordId,
		});

		expect(result).toMatchObject({
			ok: false,
			error: { code: "FORBIDDEN" },
		});
	});
});

class InMemoryResearchWorkflowRepository implements ResearchWorkflowRepository {
	readonly files: RepositoryFile[] = [];
	readonly records: ResearchRecord[];

	constructor(records: ResearchRecord[] = []) {
		this.records = records;
	}

	async createSubmissionDraft(
		input: ResearchSubmissionInput & { ownerId: EntityId },
	) {
		const record = researchRecord({
			accessLevel: input.accessLevel,
			abstract: input.abstract,
			ownerId: input.ownerId,
			status: "submitted",
			title: input.title,
		});

		this.records.push(record);

		return {
			id: record.id,
			status: record.status,
		};
	}

	async findResearchRecordById(id: EntityId) {
		return this.records.find((record) => record.id === id) ?? null;
	}

	async findFileById(id: EntityId) {
		return this.files.find((file) => file.id === id) ?? null;
	}

	async updateResearchStatus(id: EntityId, status: ResearchRecord["status"]) {
		const record = await this.findResearchRecordById(id);

		if (!record) {
			throw new Error("Missing test record.");
		}

		record.status = status;
		record.updatedAt = new Date("2026-01-02T00:00:00.000Z");

		return record;
	}

	async attachUploadedFileMetadata(
		input: SignedUploadRequest & { objectKey: string; uploaderId: EntityId },
	) {
		const file = repositoryFile({
			accessLevel: input.file.accessLevel,
			checksum: input.file.checksum ?? null,
			fileSizeBytes: input.file.fileSizeBytes,
			filename: input.file.filename,
			mimeType: input.file.mimeType,
			objectKey: input.objectKey,
			purpose: input.file.purpose,
			researchRecordId: input.researchRecordId ?? null,
			uploaderId: input.uploaderId,
		});

		this.files.push(file);

		return file;
	}
}

class InMemoryWorkflowAuditRepository implements ResearchWorkflowAuditRepository {
	readonly auditLogs: Array<{
		actorId: EntityId | null;
		action: string;
		targetType: string;
		targetId: EntityId | null;
		ipAddress: string | null;
		userAgent: string | null;
		metadata: Record<string, unknown>;
	}> = [];
	readonly approvalHistory: ApprovalHistoryEntry[] = [];

	async appendAuditLog(input: (typeof this.auditLogs)[number]) {
		this.auditLogs.push(input);
		return input;
	}

	async appendApprovalHistory(
		entry: Omit<ApprovalHistoryEntry, "id" | "createdAt">,
	) {
		const historyEntry = {
			...entry,
			id: "00000000-0000-4000-8000-000000000041",
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
		};

		this.approvalHistory.push(historyEntry);

		return historyEntry;
	}
}

class InMemoryStorageSigner implements ObjectStorageSigner {
	lastUploadObjectKey = "";

	async createUploadUrl(input: {
		filename: string;
		uploaderId: EntityId;
		researchRecordId?: EntityId | null;
	}) {
		this.lastUploadObjectKey = `uploads/${input.uploaderId}/${input.filename}`;

		return {
			expiresAt: new Date("2026-01-01T00:15:00.000Z"),
			headers: { "content-type": "application/pdf" },
			method: "PUT" as const,
			objectKey: this.lastUploadObjectKey,
			url: `https://r2.example.test/${this.lastUploadObjectKey}`,
		};
	}

	async createDownloadUrl(file: RepositoryFile) {
		return {
			expiresAt: new Date("2026-01-01T00:15:00.000Z"),
			method: "GET" as const,
			objectKey: file.objectKey,
			url: `https://r2.example.test/${file.objectKey}`,
		};
	}
}

function submissionPayload(): ResearchSubmissionInput {
	return {
		accessLevel: "restricted",
		abstract:
			"This research output documents a tested institutional repository workflow with metadata, authorship, access controls, and review-ready files.",
		authors: [
			{
				affiliation: "Obafemi Awolowo University",
				email: "researcher@example.edu",
				isCorresponding: true,
				name: "Dr Test Researcher",
			},
		],
		completedOn: "2026-01-01",
		departmentId,
		facultyId,
		files: [signedUploadPayload().file],
		keywords: ["Repository", "Workflow", "Repository"],
		publication: {
			citation: null,
			doi: null,
			isbn: null,
			issue: null,
			journal: "Repository Testing Journal",
			pages: null,
			publishedOn: "2026-01-01",
			publisher: "OAU",
			title: "Repository workflow validation",
			type: "journal_article",
			url: null,
			volume: null,
		},
		requiresIpttoReview: false,
		researchArea: "Repository Systems",
		startedOn: "2025-01-01",
		title: "Repository workflow validation",
	};
}

function signedUploadPayload(): SignedUploadRequest {
	return {
		researchRecordId,
		file: {
			accessLevel: "restricted",
			checksum: "0123456789abcdef",
			fileSizeBytes: 1024,
			filename: "repository-output.pdf",
			mimeType: "application/pdf",
			purpose: "research_document",
		},
	};
}

function researchRecord(
	overrides: Partial<ResearchRecord> = {},
): ResearchRecord {
	const now = new Date("2026-01-01T00:00:00.000Z");

	return {
		accessLevel: "restricted",
		abstract: "A complete research record used by integration tests.",
		completedOn: null,
		createdAt: now,
		departmentId,
		facultyId,
		id: researchRecordId,
		metadata: {},
		ownerId,
		publishedAt: null,
		researchArea: "Repository Systems",
		slug: "repository-workflow-validation",
		startedOn: null,
		status: "submitted",
		title: "Repository workflow validation",
		updatedAt: now,
		...overrides,
	};
}

function repositoryFile(
	overrides: Partial<RepositoryFile> = {},
): RepositoryFile {
	const now = new Date("2026-01-01T00:00:00.000Z");

	return {
		accessLevel: "restricted",
		bucket: "oau-repository",
		checksum: "0123456789abcdef",
		createdAt: now,
		fileSizeBytes: 1024,
		filename: "repository-output.pdf",
		id: fileId,
		metadata: {},
		mimeType: "application/pdf",
		objectKey: "uploads/test/repository-output.pdf",
		publicationId: null,
		purpose: "research_document",
		researchRecordId,
		updatedAt: now,
		uploaderId: ownerId,
		...overrides,
	};
}
