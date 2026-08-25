import type { RoleKey, UserStatus } from "#/domain/organization.ts";
import { permissions } from "#/domain/permissions.ts";

import { type AuthenticatedActor, requirePermission } from "./authorization.ts";
import { fail, ok } from "./result.ts";

export type AssignableStaffRole =
	| "lecturer"
	| "department_administrator"
	| "faculty_administrator"
	| "iptto_officer";

export type UserAccessSummary = {
	departmentId: string | null;
	email: string;
	facultyId: string | null;
	id: string;
	name: string;
	roles: readonly RoleKey[];
	staffId: string;
	status: UserStatus;
};

export type UserAccessRepository = {
	departmentBelongsToFaculty(
		departmentId: string,
		facultyId: string,
	): Promise<boolean>;
	listUsers(): Promise<readonly UserAccessSummary[]>;
	setUserAccess(input: {
		actorId: string;
		departmentId: string | null;
		facultyId: string | null;
		role: AssignableStaffRole;
		userId: string;
	}): Promise<void>;
};

export function createUserAccessService(repository: UserAccessRepository) {
	return {
		async list(actor: AuthenticatedActor | null | undefined) {
			const authorization = requirePermission(actor, permissions.manageUsers);
			if (!authorization.ok) return authorization;
			return ok(await repository.listUsers());
		},

		async setAccess(
			actor: AuthenticatedActor | null | undefined,
			input: {
				departmentId: string | null;
				facultyId: string | null;
				role: AssignableStaffRole;
				userId: string;
			},
		) {
			const authorization = requirePermission(actor, permissions.manageRoles);
			if (!authorization.ok) return authorization;
			if (authorization.value.userId === input.userId) {
				return fail(
					"SELF_ACCESS_CHANGE_FORBIDDEN",
					"Use another Super Administrator to change your own access.",
				);
			}
			if (input.role === "department_administrator" && !input.departmentId) {
				return fail(
					"DEPARTMENT_SCOPE_REQUIRED",
					"Choose the department this administrator will review.",
				);
			}
			if (input.role === "department_administrator" && !input.facultyId) {
				return fail(
					"FACULTY_SCOPE_REQUIRED",
					"Choose the faculty that contains this department.",
				);
			}
			if (input.role === "faculty_administrator" && !input.facultyId) {
				return fail(
					"FACULTY_SCOPE_REQUIRED",
					"Choose the faculty this administrator will review.",
				);
			}
			if (
				input.role === "department_administrator" &&
				!(await repository.departmentBelongsToFaculty(
					input.departmentId as string,
					input.facultyId as string,
				))
			) {
				return fail(
					"DEPARTMENT_FACULTY_MISMATCH",
					"The selected department does not belong to that faculty.",
				);
			}
			await repository.setUserAccess({
				...input,
				actorId: authorization.value.userId,
			});
			return ok({ role: input.role, userId: input.userId });
		},
	};
}
