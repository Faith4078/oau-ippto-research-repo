import type { ResearchWorkflowAuditRepository } from "#/application/research-workflow.ts";
import type { ApprovalHistoryEntry } from "#/domain/index.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class DrizzleResearchWorkflowAuditRepository
	implements ResearchWorkflowAuditRepository
{
	constructor(private readonly database: Database) {}

	async appendAuditLog(
		input: Parameters<ResearchWorkflowAuditRepository["appendAuditLog"]>[0],
	): Promise<unknown> {
		const [entry] = await this.database
			.insert(schema.auditLogs)
			.values(input)
			.returning({ id: schema.auditLogs.id });

		return entry;
	}

	async appendApprovalHistory(
		entry: Omit<ApprovalHistoryEntry, "id" | "createdAt">,
	): Promise<ApprovalHistoryEntry> {
		const [created] = await this.database
			.insert(schema.approvalHistory)
			.values({
				researchRecordId: entry.researchRecordId,
				innovationId: entry.innovationId,
				patentId: entry.patentId,
				action: entry.action,
				fromStatus: entry.fromStatus,
				toStatus: entry.toStatus,
				actorId: entry.actorId,
				comment: entry.comment,
			})
			.returning();

		if (!created) {
			throw new Error("Approval history could not be saved.");
		}

		return created;
	}
}
