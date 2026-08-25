import { and, eq } from "drizzle-orm";

import type {
	AssignableStaffRole,
	UserAccessRepository,
	UserAccessSummary,
} from "#/application/user-access.ts";
import type { RoleKey } from "#/domain/organization.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

const roleNames: Record<AssignableStaffRole, string> = {
	department_administrator: "Department Administrator",
	faculty_administrator: "Faculty Administrator",
	iptto_officer: "IPTTO Officer",
	lecturer: "Lecturer",
};

const roleKeys = new Set<RoleKey>([
	"visitor",
	"lecturer",
	"department_administrator",
	"faculty_administrator",
	"iptto_officer",
	"super_administrator",
]);

function isRoleKey(value: string | null): value is RoleKey {
	return value !== null && roleKeys.has(value as RoleKey);
}

export class PostgresUserAccessRepository implements UserAccessRepository {
	constructor(private readonly database: Database) {}

	async departmentBelongsToFaculty(
		departmentId: string,
		facultyId: string,
	): Promise<boolean> {
		const [department] = await this.database
			.select({ id: schema.departments.id })
			.from(schema.departments)
			.where(
				and(
					eq(schema.departments.id, departmentId),
					eq(schema.departments.facultyId, facultyId),
				),
			)
			.limit(1);
		return Boolean(department);
	}

	async listUsers(): Promise<readonly UserAccessSummary[]> {
		const rows = await this.database
			.select({
				departmentId: schema.userProfiles.departmentId,
				email: schema.users.email,
				facultyId: schema.userProfiles.facultyId,
				id: schema.users.id,
				name: schema.users.name,
				role: schema.roles.key,
				staffId: schema.users.staffId,
				status: schema.users.status,
			})
			.from(schema.users)
			.leftJoin(
				schema.userProfiles,
				eq(schema.userProfiles.userId, schema.users.id),
			)
			.leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
			.leftJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId));

		const users = new Map<string, UserAccessSummary>();
		for (const row of rows) {
			const current = users.get(row.id);
			if (current) {
				if (isRoleKey(row.role) && !current.roles.includes(row.role))
					current.roles = [...current.roles, row.role];
				continue;
			}
			users.set(row.id, {
				departmentId: row.departmentId,
				email: row.email,
				facultyId: row.facultyId,
				id: row.id,
				name: row.name,
				roles: isRoleKey(row.role) ? [row.role] : [],
				staffId: row.staffId,
				status: row.status,
			});
		}
		return [...users.values()].sort((left, right) =>
			left.name.localeCompare(right.name),
		);
	}

	async setUserAccess(input: {
		actorId: string;
		departmentId: string | null;
		facultyId: string | null;
		role: AssignableStaffRole;
		userId: string;
	}): Promise<void> {
		await this.database.transaction(async (transaction) => {
			const currentRoles = await transaction
				.select({ key: schema.roles.key })
				.from(schema.userRoles)
				.innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
				.where(eq(schema.userRoles.userId, input.userId));
			if (currentRoles.some((role) => role.key === "super_administrator")) {
				throw new Error(
					"Super Administrator access cannot be replaced from this form.",
				);
			}

			const [role] = await transaction
				.insert(schema.roles)
				.values({
					isSystem: true,
					key: input.role,
					name: roleNames[input.role],
				})
				.onConflictDoUpdate({
					target: schema.roles.key,
					set: {
						name: roleNames[input.role],
						isSystem: true,
						updatedAt: new Date(),
					},
				})
				.returning({ id: schema.roles.id });
			if (!role)
				throw new Error("The selected access role could not be prepared.");

			await transaction
				.delete(schema.userRoles)
				.where(eq(schema.userRoles.userId, input.userId));
			await transaction.insert(schema.userRoles).values({
				assignedById: input.actorId,
				departmentId:
					input.role === "department_administrator" ? input.departmentId : null,
				facultyId:
					input.role === "faculty_administrator" ? input.facultyId : null,
				roleId: role.id,
				userId: input.userId,
			});
			await transaction
				.update(schema.userProfiles)
				.set({
					departmentId: input.departmentId,
					facultyId: input.facultyId,
					updatedAt: new Date(),
				})
				.where(eq(schema.userProfiles.userId, input.userId));
			await transaction.insert(schema.auditLogs).values({
				action: "user.access.changed",
				actorId: input.actorId,
				metadata: {
					departmentId: input.departmentId,
					facultyId: input.facultyId,
					role: input.role,
				},
				targetId: input.userId,
				targetType: "user",
			});
		});
	}
}
