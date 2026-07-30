import type { ApprovalAction, EntityId, Metadata } from "./common.ts";

export type ApprovalHistoryEntry = {
	id: EntityId;
	researchRecordId: EntityId | null;
	innovationId: EntityId | null;
	patentId: EntityId | null;
	action: ApprovalAction;
	fromStatus: string | null;
	toStatus: string | null;
	actorId: EntityId | null;
	comment: string | null;
	createdAt: Date;
};

export type AuditLogEntry = {
	id: EntityId;
	actorId: EntityId | null;
	action: string;
	targetType: string;
	targetId: EntityId | null;
	ipAddress: string | null;
	userAgent: string | null;
	metadata: Metadata;
	createdAt: Date;
};
