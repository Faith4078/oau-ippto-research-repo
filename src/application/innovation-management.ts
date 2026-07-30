import type {
	CommercializationActivity,
	EntityId,
	Innovation,
	Patent,
} from "#/domain/index.ts";
import { permissions } from "#/domain/permissions.ts";
import {
	type CommercializationActivityInput,
	commercializationActivityInputSchema,
	type InnovationCreateInput,
	type InnovationReviewInput,
	type InnovationUpdateInput,
	innovationCreateInputSchema,
	innovationReviewInputSchema,
	innovationUpdateInputSchema,
	type PatentUpdateInput,
	type PatentUpsertInput,
	patentUpdateInputSchema,
	patentUpsertInputSchema,
	validatePayload,
} from "#/lib/validation.ts";

import {
	type AuthenticatedActor,
	requireAnyPermission,
	requirePermission,
} from "./authorization.ts";
import type { ResearchWorkflowAuditContext } from "./research-workflow.ts";
import { fail, ok, type Result } from "./result.ts";

export type SupportingFileLink = {
	fileId: EntityId;
	label?: string | null;
};

export type InnovationRecordInput = InnovationCreateInput & {
	createdById: EntityId;
};

export type InnovationRecordUpdate = InnovationUpdateInput & {
	updatedById: EntityId;
};

export type PatentRecordInput = PatentUpsertInput & {
	createdById: EntityId;
};

export type PatentRecordUpdate = PatentUpdateInput & {
	updatedById: EntityId;
};

export type CommercializationRecordInput = CommercializationActivityInput & {
	createdById: EntityId;
};

export type InnovationManagementRepository = {
	createInnovation(input: InnovationRecordInput): Promise<Innovation>;
	updateInnovation(
		id: EntityId,
		input: InnovationRecordUpdate,
	): Promise<Innovation | null>;
	findInnovationById(id: EntityId): Promise<Innovation | null>;
	appendInnovationReview(input: {
		innovationId: EntityId;
		reviewerId: EntityId;
		decision: InnovationReviewInput["decision"];
		notes: string | null;
	}): Promise<unknown>;
	updateInnovationStatus(
		id: EntityId,
		status: Innovation["status"],
	): Promise<Innovation | null>;
	createPatent(input: PatentRecordInput): Promise<Patent>;
	updatePatent(id: EntityId, input: PatentRecordUpdate): Promise<Patent | null>;
	findPatentById(id: EntityId): Promise<Patent | null>;
	createCommercializationActivity(
		input: CommercializationRecordInput,
	): Promise<CommercializationActivity>;
	listPublicRelatedRecords(input: {
		researchRecordId?: EntityId | null;
		innovationId?: EntityId | null;
		patentId?: EntityId | null;
	}): Promise<PublicRelatedRecords>;
};

export type InnovationManagementAuditRepository = {
	appendAuditLog(input: {
		actorId: EntityId | null;
		action: string;
		targetType: string;
		targetId: EntityId | null;
		ipAddress: string | null;
		userAgent: string | null;
		metadata: Record<string, unknown>;
	}): Promise<unknown>;
	appendApprovalHistory(input: {
		researchRecordId: EntityId | null;
		innovationId: EntityId | null;
		patentId: EntityId | null;
		action:
			| "approved"
			| "rejected"
			| "changes_requested"
			| "published"
			| "archived";
		fromStatus: string | null;
		toStatus: string | null;
		actorId: EntityId | null;
		comment: string | null;
	}): Promise<unknown>;
};

export type PublicRelatedRecords = {
	innovations: Innovation[];
	patents: Patent[];
	commercializationActivities: CommercializationActivity[];
};

export type InnovationManagementService = ReturnType<
	typeof createInnovationManagementService
>;

export function createInnovationManagementService(dependencies: {
	repository: InnovationManagementRepository;
	auditRepository: InnovationManagementAuditRepository;
}) {
	const { auditRepository, repository } = dependencies;

	return {
		async createInnovation(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Innovation>> {
			const input = validatePayload(innovationCreateInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			const authorization = requireAnyPermission(
				actor,
				[permissions.createInnovation, permissions.manageSystemSettings],
				scopeFromInnovationInput(input.value),
			);

			if (!authorization.ok) {
				return authorization;
			}

			const innovation = await repository.createInnovation({
				...input.value,
				createdById: authorization.value.userId,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "innovation.created",
				targetType: "innovation",
				targetId: innovation.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: { status: innovation.status },
			});

			return ok(innovation);
		},

		async updateInnovation(
			actor: AuthenticatedActor | null | undefined,
			innovationId: EntityId,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Innovation>> {
			const current = await repository.findInnovationById(innovationId);

			if (!current) {
				return fail(
					"INNOVATION_NOT_FOUND",
					"The innovation record was not found.",
				);
			}

			const authorization = requireAnyPermission(
				actor,
				[permissions.editInnovation, permissions.manageSystemSettings],
				scopeFromInnovation(current),
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(innovationUpdateInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			if (input.value.status && input.value.status !== current.status) {
				return fail(
					"INVALID_INNOVATION_STATUS_EDIT",
					"Use the review, publish, or archive action to change innovation status.",
				);
			}

			const updated = await repository.updateInnovation(innovationId, {
				...input.value,
				updatedById: authorization.value.userId,
			});

			if (!updated) {
				return fail(
					"INNOVATION_NOT_FOUND",
					"The innovation record was not found.",
				);
			}

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "innovation.updated",
				targetType: "innovation",
				targetId: updated.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: { status: updated.status },
			});

			return ok(updated);
		},

		async reviewInnovation(
			actor: AuthenticatedActor | null | undefined,
			innovationId: EntityId,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Innovation>> {
			const current = await repository.findInnovationById(innovationId);

			if (!current) {
				return fail(
					"INNOVATION_NOT_FOUND",
					"The innovation record was not found.",
				);
			}

			const authorization = requireAnyPermission(
				actor,
				[permissions.reviewInnovation, permissions.manageSystemSettings],
				scopeForInnovationAction(actor, current),
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(innovationReviewInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			const transition = resolveInnovationReview(current.status, input.value);

			if (!transition.ok) {
				return transition;
			}

			const updated = await repository.updateInnovationStatus(
				innovationId,
				transition.value.toStatus,
			);

			if (!updated) {
				return fail(
					"INNOVATION_NOT_FOUND",
					"The innovation record was not found.",
				);
			}

			await repository.appendInnovationReview({
				innovationId,
				reviewerId: authorization.value.userId,
				decision: input.value.decision,
				notes: input.value.notes ?? null,
			});

			await appendInnovationHistoryAndAudit({
				auditRepository,
				actorId: authorization.value.userId,
				context,
				innovationId,
				action: transition.value.action,
				fromStatus: current.status,
				toStatus: updated.status,
				comment: input.value.notes ?? null,
			});

			return ok(updated);
		},

		async publishInnovation(
			actor: AuthenticatedActor | null | undefined,
			innovationId: EntityId,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Innovation>> {
			return transitionInnovationVisibility({
				actor,
				innovationId,
				context,
				repository,
				auditRepository,
				permission: permissions.publishInnovation,
				action: "published",
				toStatus: "published",
				allowedFrom: ["approved"],
			});
		},

		async archiveInnovation(
			actor: AuthenticatedActor | null | undefined,
			innovationId: EntityId,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Innovation>> {
			return transitionInnovationVisibility({
				actor,
				innovationId,
				context,
				repository,
				auditRepository,
				permission: permissions.archiveInnovation,
				action: "archived",
				toStatus: "archived",
				allowedFrom: ["draft", "under_review", "approved", "published"],
			});
		},

		async createPatent(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Patent>> {
			const authorization = requirePermission(actor, permissions.managePatent);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(patentUpsertInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			const patent = await repository.createPatent({
				...input.value,
				createdById: authorization.value.userId,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "patent.created",
				targetType: "patent",
				targetId: patent.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: { status: patent.status, innovationId: patent.innovationId },
			});

			return ok(patent);
		},

		async updatePatent(
			actor: AuthenticatedActor | null | undefined,
			patentId: EntityId,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<Patent>> {
			const authorization = requirePermission(actor, permissions.managePatent);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(patentUpdateInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			const patent = await repository.updatePatent(patentId, {
				...input.value,
				updatedById: authorization.value.userId,
			});

			if (!patent) {
				return fail("PATENT_NOT_FOUND", "The patent record was not found.");
			}

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "patent.updated",
				targetType: "patent",
				targetId: patent.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: { status: patent.status, innovationId: patent.innovationId },
			});

			return ok(patent);
		},

		async createCommercializationActivity(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<CommercializationActivity>> {
			const authorization = requirePermission(
				actor,
				permissions.manageCommercialization,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(
				commercializationActivityInputSchema,
				payload,
			);

			if (!input.ok) {
				return input;
			}

			const activity = await repository.createCommercializationActivity({
				...input.value,
				createdById: authorization.value.userId,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "commercialization.created",
				targetType: "commercialization_activity",
				targetId: activity.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: {
					type: activity.type,
					status: activity.status,
					innovationId: activity.innovationId,
					patentId: activity.patentId,
				},
			});

			return ok(activity);
		},

		async listPublicRelatedRecords(payload: {
			researchRecordId?: EntityId | null;
			innovationId?: EntityId | null;
			patentId?: EntityId | null;
		}): Promise<Result<PublicRelatedRecords>> {
			return ok(await repository.listPublicRelatedRecords(payload));
		},
	};
}

function resolveInnovationReview(
	status: Innovation["status"],
	input: InnovationReviewInput,
): Result<{
	toStatus: Innovation["status"];
	action: "approved" | "rejected" | "changes_requested";
}> {
	if (status !== "under_review") {
		return fail(
			"INVALID_INNOVATION_REVIEW_STATUS",
			"Only innovations under review can receive an IPTTO review decision.",
		);
	}

	if (input.decision === "approved") {
		return ok({ toStatus: "approved", action: "approved" });
	}

	if (input.decision === "changes_requested") {
		if (!input.notes) {
			return fail(
				"INNOVATION_REVIEW_NOTES_REQUIRED",
				"Change requests require review notes.",
			);
		}

		return ok({ toStatus: "draft", action: "changes_requested" });
	}

	if (!input.notes) {
		return fail(
			"INNOVATION_REVIEW_NOTES_REQUIRED",
			"Rejected innovations require review notes.",
		);
	}

	return ok({ toStatus: "archived", action: "rejected" });
}

async function transitionInnovationVisibility(input: {
	actor: AuthenticatedActor | null | undefined;
	innovationId: EntityId;
	context: ResearchWorkflowAuditContext;
	repository: InnovationManagementRepository;
	auditRepository: InnovationManagementAuditRepository;
	permission: (typeof permissions)[keyof typeof permissions];
	action: "published" | "archived";
	toStatus: Innovation["status"];
	allowedFrom: Innovation["status"][];
}): Promise<Result<Innovation>> {
	const current = await input.repository.findInnovationById(input.innovationId);

	if (!current) {
		return fail("INNOVATION_NOT_FOUND", "The innovation record was not found.");
	}

	const authorization = requirePermission(
		input.actor,
		input.permission,
		scopeForInnovationAction(input.actor, current),
	);

	if (!authorization.ok) {
		return authorization;
	}

	if (!input.allowedFrom.includes(current.status)) {
		return fail(
			"INVALID_INNOVATION_TRANSITION",
			`Innovation status ${current.status} cannot transition to ${input.toStatus}.`,
		);
	}

	const updated = await input.repository.updateInnovationStatus(
		input.innovationId,
		input.toStatus,
	);

	if (!updated) {
		return fail("INNOVATION_NOT_FOUND", "The innovation record was not found.");
	}

	await appendInnovationHistoryAndAudit({
		auditRepository: input.auditRepository,
		actorId: authorization.value.userId,
		context: input.context,
		innovationId: input.innovationId,
		action: input.action,
		fromStatus: current.status,
		toStatus: updated.status,
		comment: null,
	});

	return ok(updated);
}

async function appendInnovationHistoryAndAudit(input: {
	auditRepository: InnovationManagementAuditRepository;
	actorId: EntityId;
	context: ResearchWorkflowAuditContext;
	innovationId: EntityId;
	action:
		| "approved"
		| "rejected"
		| "changes_requested"
		| "published"
		| "archived";
	fromStatus: Innovation["status"];
	toStatus: Innovation["status"];
	comment: string | null;
}) {
	await input.auditRepository.appendApprovalHistory({
		researchRecordId: null,
		innovationId: input.innovationId,
		patentId: null,
		action: input.action,
		fromStatus: input.fromStatus,
		toStatus: input.toStatus,
		actorId: input.actorId,
		comment: input.comment,
	});

	await input.auditRepository.appendAuditLog({
		actorId: input.actorId,
		action: `innovation.workflow.${input.action}`,
		targetType: "innovation",
		targetId: input.innovationId,
		ipAddress: input.context.ipAddress ?? null,
		userAgent: input.context.userAgent ?? null,
		metadata: {
			fromStatus: input.fromStatus,
			toStatus: input.toStatus,
		},
	});
}

function scopeFromInnovationInput(input: InnovationCreateInput) {
	return {
		facultyId: input.facultyId ?? null,
		departmentId: input.departmentId ?? null,
		ownerId: input.leadResearcherId ?? null,
	};
}

function scopeFromInnovation(innovation: Innovation) {
	return {
		facultyId: innovation.facultyId,
		departmentId: innovation.departmentId,
		ownerId: innovation.leadResearcherId,
	};
}

function scopeForInnovationAction(
	actor: AuthenticatedActor | null | undefined,
	innovation: Innovation,
) {
	if (
		actor?.roles.some((assignment) =>
			["iptto_officer", "super_administrator"].includes(assignment.role),
		)
	) {
		return undefined;
	}

	return scopeFromInnovation(innovation);
}
