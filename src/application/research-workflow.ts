import { resolveResearchTransition } from "../domain/approval-workflow.ts";
import type {
	ApprovalHistoryEntry,
	EntityId,
	RepositoryFile,
	ResearchRecord,
} from "../domain/index.ts";
import { permissions } from "../domain/permissions.ts";
import {
	type ResearchApprovalTransitionInput,
	type ResearchSubmissionInput,
	researchApprovalTransitionInputSchema,
	researchSubmissionInputSchema,
	type SignedDownloadRequest,
	type SignedUploadRequest,
	signedDownloadRequestSchema,
	signedUploadRequestSchema,
	validatePayload,
} from "../lib/validation.ts";
import {
	type AuthenticatedActor,
	canAccessResearchRecord,
	requireAnyPermission,
	requirePermission,
} from "./authorization.ts";
import { fail, ok, type Result } from "./result.ts";

export type ResearchSubmissionDraft = {
	id: EntityId;
	status: ResearchRecord["status"];
};

export type SignedUrl = {
	url: string;
	method: "GET" | "PUT";
	expiresAt: Date;
	headers?: Record<string, string>;
	objectKey: string;
};

export type ResearchWorkflowAuditContext = {
	ipAddress?: string | null;
	userAgent?: string | null;
};

export type ResearchWorkflowRepository = {
	createSubmissionDraft(
		input: ResearchSubmissionInput & { ownerId: EntityId },
	): Promise<ResearchSubmissionDraft>;
	findResearchRecordById(id: EntityId): Promise<ResearchRecord | null>;
	findFileById(id: EntityId): Promise<RepositoryFile | null>;
	updateResearchStatus(
		id: EntityId,
		status: ResearchRecord["status"],
	): Promise<ResearchRecord>;
	attachUploadedFileMetadata(
		input: SignedUploadRequest & {
			objectKey: string;
			uploaderId: EntityId;
		},
	): Promise<RepositoryFile>;
};

export type ResearchWorkflowAuditRepository = {
	appendAuditLog(input: {
		actorId: EntityId | null;
		action: string;
		targetType: string;
		targetId: EntityId | null;
		ipAddress: string | null;
		userAgent: string | null;
		metadata: Record<string, unknown>;
	}): Promise<unknown>;
	appendApprovalHistory(
		entry: Omit<ApprovalHistoryEntry, "id" | "createdAt">,
	): Promise<ApprovalHistoryEntry>;
};

export type ObjectStorageSigner = {
	createUploadUrl(input: {
		filename: string;
		mimeType: string;
		fileSizeBytes: number;
		checksum?: string | null;
		purpose: string;
		uploaderId: EntityId;
		researchRecordId?: EntityId | null;
	}): Promise<SignedUrl>;
	createDownloadUrl(file: RepositoryFile): Promise<SignedUrl>;
};

export type ResearchWorkflowService = ReturnType<
	typeof createResearchWorkflowService
>;

export function createResearchWorkflowService(dependencies: {
	researchRepository: ResearchWorkflowRepository;
	auditRepository: ResearchWorkflowAuditRepository;
	storageSigner: ObjectStorageSigner;
}) {
	const { auditRepository, researchRepository, storageSigner } = dependencies;

	return {
		async createSubmission(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<ResearchSubmissionDraft>> {
			const authorization = requirePermission(
				actor,
				permissions.submitResearch,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(researchSubmissionInputSchema, payload);

			if (!input.ok) {
				return input;
			}

			const draft = await researchRepository.createSubmissionDraft({
				...input.value,
				ownerId: authorization.value.userId,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "research.submission.created",
				targetType: "research_record",
				targetId: draft.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: {
					status: draft.status,
					fileCount: input.value.files.length,
					keywordCount: input.value.keywords.length,
				},
			});

			return ok(draft);
		},

		async transitionApproval(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<ResearchRecord>> {
			const input = validatePayload(
				researchApprovalTransitionInputSchema,
				payload,
			);

			if (!input.ok) {
				return input;
			}

			const record = await researchRepository.findResearchRecordById(
				input.value.researchRecordId,
			);

			if (!record) {
				return fail("RESEARCH_NOT_FOUND", "The research record was not found.");
			}

			const authorization = requireAnyPermission(
				actor,
				permissionsForApprovalDecision(input.value),
				{
					facultyId: record.facultyId,
					departmentId: record.departmentId,
					ownerId: record.ownerId,
				},
			);

			if (!authorization.ok) {
				return authorization;
			}

			if (record.status !== input.value.fromStatus) {
				return fail(
					"APPROVAL_STATUS_CHANGED",
					`Research status is ${record.status}, not ${input.value.fromStatus}.`,
				);
			}

			const transition = resolveResearchTransition({
				from: input.value.fromStatus,
				to: input.value.toStatus,
				decision: input.value.decision,
				comment: input.value.comment,
				requiresIpttoReview: record.metadata.requiresIpttoReview === true,
			});

			if (!transition.ok) {
				return fail(transition.error.code, transition.error.message);
			}

			const updated = await researchRepository.updateResearchStatus(
				record.id,
				transition.value.to,
			);

			await auditRepository.appendApprovalHistory({
				researchRecordId: record.id,
				innovationId: null,
				patentId: null,
				action: transition.value.action,
				fromStatus: transition.value.from,
				toStatus: transition.value.to,
				actorId: authorization.value.userId,
				comment: input.value.comment ?? null,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: `research.workflow.${transition.value.action}`,
				targetType: "research_record",
				targetId: record.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: {
					fromStatus: transition.value.from,
					toStatus: transition.value.to,
					decision: transition.value.decision,
				},
			});

			return ok(updated);
		},

		async createSignedUploadUrl(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<SignedUrl>> {
			const authorization = requirePermission(
				actor,
				permissions.createFileUploadUrl,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(signedUploadRequestSchema, payload);

			if (!input.ok) {
				return input;
			}

			const signedUrl = await storageSigner.createUploadUrl({
				...input.value.file,
				uploaderId: authorization.value.userId,
				researchRecordId: input.value.researchRecordId ?? null,
			});

			await auditRepository.appendAuditLog({
				actorId: authorization.value.userId,
				action: "research.file.upload_url_created",
				targetType: "research_record",
				targetId: input.value.researchRecordId ?? null,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: {
					objectKey: signedUrl.objectKey,
					filename: input.value.file.filename,
					fileSizeBytes: input.value.file.fileSizeBytes,
				},
			});

			return ok(signedUrl);
		},

		async confirmUploadedFile(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			objectKey: string,
		): Promise<Result<RepositoryFile>> {
			const authorization = requirePermission(
				actor,
				permissions.createFileUploadUrl,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const input = validatePayload(signedUploadRequestSchema, payload);

			if (!input.ok) {
				return input;
			}

			const file = await researchRepository.attachUploadedFileMetadata({
				...input.value,
				objectKey,
				uploaderId: authorization.value.userId,
			});

			return ok(file);
		},

		async createSignedDownloadUrl(
			actor: AuthenticatedActor | null | undefined,
			payload: unknown,
			context: ResearchWorkflowAuditContext = {},
		): Promise<Result<SignedUrl>> {
			const input = validatePayload(signedDownloadRequestSchema, payload);

			if (!input.ok) {
				return input;
			}

			const file = await researchRepository.findFileById(input.value.fileId);

			if (!file) {
				return fail("FILE_NOT_FOUND", "The repository file was not found.");
			}

			const record = await loadRecordForFile(
				researchRepository,
				file,
				input.value,
			);

			if (!record || !canAccessResearchRecord(actor, record)) {
				return fail(
					"FORBIDDEN",
					"You do not have permission to access this file.",
				);
			}

			const authorization = requirePermission(
				actor,
				permissions.createFileDownloadUrl,
				{
					facultyId: record.facultyId,
					departmentId: record.departmentId,
					ownerId: record.ownerId,
				},
			);

			if (file.accessLevel !== "public" && !authorization.ok) {
				return authorization;
			}

			const signedUrl = await storageSigner.createDownloadUrl(file);

			await auditRepository.appendAuditLog({
				actorId: actor?.userId ?? null,
				action: "research.file.download_url_created",
				targetType: "file",
				targetId: file.id,
				ipAddress: context.ipAddress ?? null,
				userAgent: context.userAgent ?? null,
				metadata: {
					researchRecordId: record.id,
					objectKey: file.objectKey,
					accessLevel: file.accessLevel,
				},
			});

			return ok(signedUrl);
		},
	};
}

function permissionsForApprovalDecision(
	input: ResearchApprovalTransitionInput,
) {
	if (input.decision === "publish") {
		return [permissions.publishResearch];
	}

	if (input.decision === "archive") {
		return [permissions.archiveResearch];
	}

	if (input.decision === "reject") {
		return [permissions.rejectResearch];
	}

	if (
		input.fromStatus === "department_review" ||
		input.toStatus === "department_review"
	) {
		return [permissions.reviewDepartmentResearch];
	}

	if (
		input.fromStatus === "faculty_review" ||
		input.toStatus === "faculty_review"
	) {
		return [permissions.reviewFacultyResearch];
	}

	if (
		input.fromStatus === "iptto_review" ||
		input.toStatus === "iptto_review"
	) {
		return [permissions.reviewIpttoResearch];
	}

	return [permissions.approveResearch];
}

async function loadRecordForFile(
	researchRepository: ResearchWorkflowRepository,
	file: RepositoryFile,
	input: SignedDownloadRequest,
) {
	const researchRecordId = file.researchRecordId ?? input.researchRecordId;

	if (!researchRecordId) {
		return null;
	}

	return researchRepository.findResearchRecordById(researchRecordId);
}
