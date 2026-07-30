import type {
	ApprovalHistoryEntry,
	AuditLogEntry,
	EntityId,
} from "../domain/index.ts";

export type AuditRepository = {
	appendAuditLog(
		entry: Omit<AuditLogEntry, "id" | "createdAt">,
	): Promise<AuditLogEntry>;
	listAuditLogsForTarget(
		targetType: string,
		targetId: EntityId,
	): Promise<AuditLogEntry[]>;
	appendApprovalHistory(
		entry: Omit<ApprovalHistoryEntry, "id" | "createdAt">,
	): Promise<ApprovalHistoryEntry>;
	listApprovalHistoryForResearchRecord(
		researchRecordId: EntityId,
	): Promise<ApprovalHistoryEntry[]>;
};
