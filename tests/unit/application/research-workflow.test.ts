import { describe, expect, it } from "vitest";

import type { AuthenticatedActor } from "#/application/authorization.ts";
import {
	createResearchWorkflowService,
	type ResearchWorkflowAuditRepository,
	type ResearchWorkflowRepository,
} from "#/application/research-workflow.ts";
import type { EntityId, ResearchRecord } from "#/domain/index.ts";

const facultyId = "00000000-0000-4000-8000-000000000001";
const departmentId = "00000000-0000-4000-8000-000000000002";

const owner: AuthenticatedActor = {
	userId: "lecturer-1",
	status: "active",
	roles: [{ role: "lecturer", departmentId, facultyId }],
};

const otherLecturer: AuthenticatedActor = {
	userId: "lecturer-2",
	status: "active",
	roles: [{ role: "lecturer", departmentId, facultyId }],
};

const validUpdatePayload = {
	title: "An updated research title",
	abstract:
		"An updated abstract that is long enough to satisfy the minimum length validation rule for research abstracts.",
	authors: [{ name: "Dr Ada Olaniyi", isCorresponding: true }],
	departmentId,
	facultyId,
	keywords: ["irrigation", "renewable energy"],
	publication: {
		type: "journal_article" as const,
		title: "An updated research title",
	},
	accessLevel: "public" as const,
	researchArea: "Agricultural engineering",
};

describe("research workflow service — edit and delete", () => {
	it("lets the owning lecturer update their own editable research record", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "iptto_review" })],
		});
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository: createFakeAuditRepository(),
			storageSigner: createFakeStorageSigner(),
		});

		const result = await service.updateSubmission(
			owner,
			"research-1",
			validUpdatePayload,
		);

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.title : null).toBe(
			"An updated research title",
		);
	});

	it("forbids a lecturer who does not own the record from editing it", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "iptto_review" })],
		});
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository: createFakeAuditRepository(),
			storageSigner: createFakeStorageSigner(),
		});

		const result = await service.updateSubmission(
			otherLecturer,
			"research-1",
			validUpdatePayload,
		);

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("FORBIDDEN");
	});

	it("refuses to edit a research record that has already been published", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "published" })],
		});
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository: createFakeAuditRepository(),
			storageSigner: createFakeStorageSigner(),
		});

		const result = await service.updateSubmission(
			owner,
			"research-1",
			validUpdatePayload,
		);

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("RESEARCH_NOT_EDITABLE");
	});

	it("archives an owned, editable research record on delete", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "draft" })],
		});
		const auditRepository = createFakeAuditRepository();
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository,
			storageSigner: createFakeStorageSigner(),
		});

		const result = await service.deleteSubmission(owner, "research-1");

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.status : null).toBe("archived");
		expect(auditRepository.approvalHistory).toHaveLength(1);
	});

	it("refuses to delete a research record that is already published", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "published" })],
		});
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository: createFakeAuditRepository(),
			storageSigner: createFakeStorageSigner(),
		});

		const result = await service.deleteSubmission(owner, "research-1");

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe(
			"RESEARCH_NOT_DELETABLE",
		);
	});

	it("requires authentication to update or delete a research record", async () => {
		const repository = createFakeRepository({
			records: [recordFactory({ status: "draft" })],
		});
		const service = createResearchWorkflowService({
			researchRepository: repository,
			auditRepository: createFakeAuditRepository(),
			storageSigner: createFakeStorageSigner(),
		});

		const updateResult = await service.updateSubmission(
			null,
			"research-1",
			validUpdatePayload,
		);
		const deleteResult = await service.deleteSubmission(null, "research-1");

		expect(updateResult.ok ? null : updateResult.error.code).toBe(
			"AUTHENTICATION_REQUIRED",
		);
		expect(deleteResult.ok ? null : deleteResult.error.code).toBe(
			"AUTHENTICATION_REQUIRED",
		);
	});
});

function createFakeRepository(seed?: {
	records?: ResearchRecord[];
}): ResearchWorkflowRepository {
	const records = [...(seed?.records ?? [])];

	return {
		async createSubmissionDraft() {
			throw new Error("not implemented in this fake");
		},
		async findResearchRecordById(id) {
			return records.find((record) => record.id === id) ?? null;
		},
		async findFileById() {
			return null;
		},
		async updateResearchStatus(id, status) {
			const record = records.find((candidate) => candidate.id === id);
			if (!record) {
				throw new Error("Research record could not be updated.");
			}
			record.status = status;
			return record;
		},
		async updateResearchRecord(id, input) {
			const record = records.find((candidate) => candidate.id === id);
			if (!record) {
				return null;
			}
			Object.assign(record, input);
			return record;
		},
		async attachUploadedFileMetadata() {
			throw new Error("not implemented in this fake");
		},
	};
}

function createFakeAuditRepository(): ResearchWorkflowAuditRepository & {
	approvalHistory: unknown[];
} {
	const approvalHistory: unknown[] = [];

	return {
		approvalHistory,
		async appendAuditLog() {
			return {};
		},
		async appendApprovalHistory(entry) {
			approvalHistory.push(entry);
			return { id: "history-1" as EntityId, createdAt: new Date(), ...entry };
		},
	};
}

function createFakeStorageSigner() {
	return {
		async createUploadUrl() {
			throw new Error("not implemented in this fake");
		},
		async createDownloadUrl() {
			throw new Error("not implemented in this fake");
		},
	};
}

function recordFactory(overrides: Partial<ResearchRecord> = {}): ResearchRecord {
	return {
		id: "research-1" as EntityId,
		title: "Cassava starch drought resilience study",
		slug: "cassava-starch-drought-resilience-study",
		abstract: "A study of drought-resilient cassava starch cultivation methods.",
		status: "draft",
		accessLevel: "public",
		facultyId,
		departmentId,
		ownerId: "lecturer-1" as EntityId,
		researchArea: "Agricultural engineering",
		startedOn: null,
		completedOn: null,
		publishedAt: null,
		commercializationStatus: null,
		fundingInfo: null,
		comment: null,
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}
