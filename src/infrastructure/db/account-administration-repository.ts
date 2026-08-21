import { and, desc, eq } from "drizzle-orm";

import type { AccountAdministrationRepository } from "#/application/account-administration.ts";
import type { EntityId } from "#/domain/common.ts";
import type { UserStatus } from "#/domain/organization.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class PostgresAccountAdministrationRepository
	implements AccountAdministrationRepository
{
	constructor(private readonly database: Database) {}

	async listPending() {
		return (await this.database
			.select({
				id: schema.users.id,
				staffId: schema.users.staffId,
				name: schema.users.name,
				email: schema.users.email,
				status: schema.users.status,
				createdAt: schema.users.createdAt,
				facultyId: schema.userProfiles.facultyId,
				departmentId: schema.userProfiles.departmentId,
			})
			.from(schema.users)
			.leftJoin(
				schema.userProfiles,
				eq(schema.userProfiles.userId, schema.users.id),
			)
			.where(eq(schema.users.status, "pending"))
			.orderBy(desc(schema.users.createdAt))) as Awaited<
			ReturnType<AccountAdministrationRepository["listPending"]>
		>;
	}

	async findById(userId: EntityId) {
		const [account] = await this.database
			.select({
				id: schema.users.id,
				staffId: schema.users.staffId,
				name: schema.users.name,
				email: schema.users.email,
				status: schema.users.status,
				createdAt: schema.users.createdAt,
				facultyId: schema.userProfiles.facultyId,
				departmentId: schema.userProfiles.departmentId,
			})
			.from(schema.users)
			.leftJoin(
				schema.userProfiles,
				eq(schema.userProfiles.userId, schema.users.id),
			)
			.where(eq(schema.users.id, userId))
			.limit(1);
		return (account ?? null) as Awaited<
			ReturnType<AccountAdministrationRepository["findById"]>
		>;
	}

	async applyStatusTransition(
		input: Parameters<
			AccountAdministrationRepository["applyStatusTransition"]
		>[0],
	) {
		return this.database.transaction(async (transaction) => {
			const [updated] = await transaction
				.update(schema.users)
				.set({ status: input.status, updatedAt: new Date() })
				.where(
					and(
						eq(schema.users.id, input.userId),
						eq(schema.users.status, input.expectedStatus),
					),
				)
				.returning({ id: schema.users.id });
			if (!updated) return false;
			await transaction.insert(schema.auditLogs).values({
				actorId: input.actorId,
				action: `account.${input.status}`,
				targetType: "user",
				targetId: input.userId,
				ipAddress: input.ipAddress,
				userAgent: input.userAgent,
				metadata: {
					fromStatus: input.expectedStatus as UserStatus,
					toStatus: input.status,
					reason: input.reason,
				},
			});
			return true;
		});
	}
}
