import { and, desc, eq, or } from "drizzle-orm";

import type {
	DashboardWorkspaceRepository,
	ResearchReviewAccess,
	ResearchReviewQueueItem,
} from "#/application/dashboard-workspaces.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class PostgresDashboardWorkspaceRepository
	implements DashboardWorkspaceRepository
{
	constructor(private readonly database: Database) {}

	async listResearchReviewQueue(
		access: ResearchReviewAccess,
	): Promise<readonly ResearchReviewQueueItem[]> {
		const statusCondition =
			access.status === "department_review"
				? or(
						eq(schema.researchRecords.status, "submitted"),
						eq(schema.researchRecords.status, "department_review"),
					)
				: eq(schema.researchRecords.status, access.status);
		const conditions = [statusCondition];

		if (access.departmentId) {
			conditions.push(
				eq(schema.researchRecords.departmentId, access.departmentId),
			);
		}
		if (access.facultyId) {
			conditions.push(eq(schema.researchRecords.facultyId, access.facultyId));
		}

		const rows = await this.database
			.select({
				abstract: schema.researchRecords.abstract,
				createdAt: schema.researchRecords.createdAt,
				department: schema.departments.name,
				faculty: schema.faculties.name,
				id: schema.researchRecords.id,
				metadata: schema.researchRecords.metadata,
				owner: schema.users.name,
				status: schema.researchRecords.status,
				title: schema.researchRecords.title,
			})
			.from(schema.researchRecords)
			.innerJoin(
				schema.departments,
				eq(schema.departments.id, schema.researchRecords.departmentId),
			)
			.innerJoin(
				schema.faculties,
				eq(schema.faculties.id, schema.researchRecords.facultyId),
			)
			.leftJoin(
				schema.users,
				eq(schema.users.id, schema.researchRecords.ownerId),
			)
			.where(and(...conditions))
			.orderBy(desc(schema.researchRecords.createdAt))
			.limit(100);

		return rows.map((row) => ({
			abstract: row.abstract,
			createdAt: row.createdAt,
			department: row.department,
			faculty: row.faculty,
			id: row.id,
			owner: row.owner ?? "Unassigned researcher",
			requiresIpttoReview: row.metadata.requiresIpttoReview === true,
			status: row.status as ResearchReviewQueueItem["status"],
			title: row.title,
		}));
	}
}
