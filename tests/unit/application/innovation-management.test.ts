import { describe, expect, it } from "vitest";

import {
	createInnovationManagementService,
	type InnovationManagementAuditRepository,
	type InnovationManagementRepository,
} from "#/application/innovation-management.ts";
import type { AuthenticatedActor } from "#/application/authorization.ts";
import type {
	CommercializationActivity,
	EntityId,
	Innovation,
	Patent,
} from "#/domain/index.ts";

const facultyId = "00000000-0000-4000-8000-000000000001";
const departmentId = "00000000-0000-4000-8000-000000000002";

const lecturer: AuthenticatedActor = {
	userId: "user-1",
	status: "active",
	roles: [
		{
			role: "lecturer",
			departmentId,
			facultyId,
		},
	],
};

const ipttoOfficer: AuthenticatedActor = {
	userId: "iptto-1",
	status: "active",
	roles: [{ role: "iptto_officer" }],
};

const validInnovationPayload = {
	title: "Cassava starch biosensor platform",
	summary:
		"A field-ready biosensor platform for rapid crop disease diagnosis and local manufacturing partnerships.",
	facultyId,
	departmentId,
	technologyReadinessLevel: 5,
	industryApplications: ["Agriculture", "Diagnostics"],
	inventors: [{ name: "Dr Ada Olaniyi", affiliation: "OAU" }],
};

describe("innovation management service", () => {
	it("allows scoped lecturers to create innovation records for review", async () => {
		const repository = createFakeRepository();
		const service = createInnovationManagementService({
			repository,
			auditRepository: createFakeAuditRepository(),
		});

		const result = await service.createInnovation(lecturer, {
			...validInnovationPayload,
			departmentId,
			facultyId,
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.status : null).toBe("under_review");
		expect(repository.innovations).toHaveLength(1);
	});

	it("requires IPTTO review notes for rejected innovations", async () => {
		const repository = createFakeRepository({
			innovations: [innovationFactory({ status: "under_review" })],
		});
		const service = createInnovationManagementService({
			repository,
			auditRepository: createFakeAuditRepository(),
		});

		const result = await service.reviewInnovation(ipttoOfficer, "innovation-1", {
			decision: "rejected",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe(
			"INNOVATION_REVIEW_NOTES_REQUIRED",
		);
	});

	it("publishes only approved innovations", async () => {
		const repository = createFakeRepository({
			innovations: [innovationFactory({ status: "under_review" })],
		});
		const service = createInnovationManagementService({
			repository,
			auditRepository: createFakeAuditRepository(),
		});

		const result = await service.publishInnovation(ipttoOfficer, "innovation-1");

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe(
			"INVALID_INNOVATION_TRANSITION",
		);
	});

	it("allows IPTTO staff to manage patent filing details and inventors", async () => {
		const repository = createFakeRepository();
		const service = createInnovationManagementService({
			repository,
			auditRepository: createFakeAuditRepository(),
		});

		const result = await service.createPatent(ipttoOfficer, {
			title: "Biosensor reagent cartridge",
			innovationId: "00000000-0000-4000-8000-000000000003",
			applicationNumber: "NG/PT/2026/113",
			jurisdiction: "Nigeria",
			status: "filed",
			filedOn: "2026-05-01",
			inventors: [{ name: "Dr Ada Olaniyi", affiliation: "OAU" }],
			supportingFiles: [
				{
					fileId: "00000000-0000-4000-8000-000000000004",
					label: "Application filing receipt",
				},
			],
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.status : null).toBe("filed");
		expect(repository.patents[0]?.applicationNumber).toBe("NG/PT/2026/113");
	});

	it("keeps commercialization tracking IPTTO-only", async () => {
		const repository = createFakeRepository();
		const service = createInnovationManagementService({
			repository,
			auditRepository: createFakeAuditRepository(),
		});

		const result = await service.createCommercializationActivity(lecturer, {
			innovationId: "00000000-0000-4000-8000-000000000003",
			type: "licensing",
			title: "Diagnostics licensing discussion",
			status: "negotiation",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("FORBIDDEN");
	});
});

function createFakeRepository(seed?: {
	innovations?: Innovation[];
	patents?: Patent[];
}): InnovationManagementRepository & {
	innovations: Innovation[];
	patents: Patent[];
} {
	const innovations = [...(seed?.innovations ?? [])];
	const patents = [...(seed?.patents ?? [])];
	const commercializationActivities: CommercializationActivity[] = [];

	return {
		innovations,
		patents,
		async createInnovation(input) {
			const innovation = innovationFactory({
				id: `innovation-${innovations.length + 1}`,
				status: "under_review",
				title: input.title,
				summary: input.summary,
				facultyId: input.facultyId ?? null,
				departmentId: input.departmentId ?? null,
				leadResearcherId: input.leadResearcherId ?? input.createdById,
			});
			innovations.push(innovation);
			return innovation;
		},
		async updateInnovation(id, input) {
			const innovation = innovations.find((record) => record.id === id);
			if (!innovation) {
				return null;
			}
			Object.assign(innovation, input);
			return innovation;
		},
		async findInnovationById(id) {
			return innovations.find((innovation) => innovation.id === id) ?? null;
		},
		async appendInnovationReview() {
			return {};
		},
		async updateInnovationStatus(id, status) {
			const innovation = innovations.find((record) => record.id === id);
			if (!innovation) {
				return null;
			}
			innovation.status = status;
			return innovation;
		},
		async createPatent(input) {
			const patent = patentFactory({
				id: `patent-${patents.length + 1}`,
				title: input.title,
				innovationId: input.innovationId ?? null,
				applicationNumber: input.applicationNumber ?? null,
				status: input.status,
			});
			patents.push(patent);
			return patent;
		},
		async updatePatent(id, input) {
			const patent = patents.find((record) => record.id === id);
			if (!patent) {
				return null;
			}
			Object.assign(patent, input);
			return patent;
		},
		async findPatentById(id) {
			return patents.find((patent) => patent.id === id) ?? null;
		},
		async createCommercializationActivity(input) {
			const activity: CommercializationActivity = {
				id: `commercialization-${commercializationActivities.length + 1}`,
				innovationId: input.innovationId ?? null,
				patentId: input.patentId ?? null,
				type: input.type,
				title: input.title,
				partnerName: input.partnerName ?? null,
				status: input.status,
				amount: input.amount ?? null,
				currency: input.currency ?? null,
				startedOn: input.startedOn ?? null,
				completedOn: input.completedOn ?? null,
				notes: input.notes ?? null,
				createdById: input.createdById,
				metadata: input.metadata,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			commercializationActivities.push(activity);
			return activity;
		},
		async listPublicRelatedRecords() {
			return {
				innovations: innovations.filter(
					(innovation) => innovation.status === "published",
				),
				patents,
				commercializationActivities,
			};
		},
	};
}

function createFakeAuditRepository(): InnovationManagementAuditRepository {
	return {
		async appendAuditLog() {
			return {};
		},
		async appendApprovalHistory() {
			return {};
		},
	};
}

function innovationFactory(overrides: Partial<Innovation> = {}): Innovation {
	return {
		id: "innovation-1" as EntityId,
		title: "Cassava starch biosensor platform",
		slug: "cassava-starch-biosensor-platform",
		summary: "Field-ready biosensor technology.",
		status: "draft",
		facultyId,
		departmentId,
		leadResearcherId: "user-1",
		researchRecordId: null,
		technologyReadinessLevel: 5,
		industryApplications: ["Agriculture"],
		intellectualPropertyNotes: null,
		publishedAt: null,
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function patentFactory(overrides: Partial<Patent> = {}): Patent {
	return {
		id: "patent-1" as EntityId,
		innovationId: null,
		title: "Biosensor reagent cartridge",
		applicationNumber: null,
		patentNumber: null,
		jurisdiction: null,
		status: "idea_disclosure",
		filedOn: null,
		grantedOn: null,
		expiresOn: null,
		abstract: null,
		claimsSummary: null,
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}
