import type { RoleKey, UserStatus } from "#/domain/organization.ts";
import { permissions } from "#/domain/permissions.ts";

import {
	type ActorRoleAssignment,
	type AuthenticatedActor,
	hasPermission,
	requirePermission,
} from "./authorization.ts";
import { fail, ok } from "./result.ts";

export type AssignableStaffRole =
	| "lecturer"
	| "department_administrator"
	| "faculty_administrator"
	| "iptto_officer";

export type UserAccessRoleAssignment = {
	assignedAt: Date;
	departmentId: string | null;
	facultyId: string | null;
	role: RoleKey;
};

export type UserAccessSummary = {
	departmentId: string | null;
	email: string;
	facultyId: string | null;
	id: string;
	name: string;
	roleAssignments: readonly UserAccessRoleAssignment[];
	roles: readonly RoleKey[];
	staffId: string;
	status: UserStatus;
};

export type UserAccessRepository = {
	departmentBelongsToFaculty(
		departmentId: string,
		facultyId: string,
	): Promise<boolean>;
	findUserRoles(userId: string): Promise<readonly RoleKey[]>;
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
			if (authorization.ok) return ok(await repository.listUsers());

			const facultyAssignment = scopedFacultyAdministratorAssignment(actor);
			if (!facultyAssignment) return authorization;
			const users = await repository.listUsers();

			return ok(
				users.filter(
					(user) =>
						user.facultyId === facultyAssignment.facultyId &&
						!user.roles.includes("super_administrator"),
				),
			);
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
			const authorization = authorizeAccessAssignment(actor, input);
			if (!authorization.ok) return authorization;
			if (authorization.value.userId === input.userId) {
				return fail(
					"SELF_ACCESS_CHANGE_FORBIDDEN",
					"Use another administrator to change your own access.",
				);
			}
			const users = await repository.listUsers();
			const targetUser = users.find((user) => user.id === input.userId);
			if (!targetUser) {
				return fail(
					"USER_ACCESS_TARGET_NOT_FOUND",
					"Staff account was not found.",
				);
			}
			if (targetUser.status !== "active") {
				return fail(
					"USER_ACCESS_TARGET_INACTIVE",
					"Approve the staff account before assigning administrator access.",
				);
			}
			const currentRoles = await repository.findUserRoles(input.userId);
			if (currentRoles.includes("super_administrator")) {
				return fail(
					"SUPER_ADMIN_ACCESS_PROTECTED",
					"Super Administrator access cannot be changed from this form.",
				);
			}
			if (
				authorization.value.scope === "system" &&
				input.role === "faculty_administrator" &&
				!currentRoles.includes("lecturer")
			) {
				return fail(
					"FACULTY_ADMIN_LECTURER_REQUIRED",
					"Choose an active lecturer from the faculty to become Faculty Administrator.",
				);
			}
			if (
				authorization.value.scope === "system" &&
				input.role === "faculty_administrator" &&
				targetUser.facultyId !== input.facultyId
			) {
				return fail(
					"FACULTY_ADMIN_SCOPE_MISMATCH",
					"Choose a lecturer who belongs to the selected faculty.",
				);
			}
			if (
				authorization.value.scope === "faculty" &&
				targetUser.facultyId !== authorization.value.facultyId
			) {
				return fail(
					"FACULTY_TARGET_SCOPE_MISMATCH",
					"Choose a staff member from your faculty.",
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

type AccessAssignmentAuthorization =
	| {
			scope: "system";
			userId: string;
	  }
	| {
			scope: "faculty";
			facultyId: string;
			userId: string;
	  };

type ScopedFacultyAdministratorAssignment = ActorRoleAssignment & {
	facultyId: string;
};

function authorizeAccessAssignment(
	actor: AuthenticatedActor | null | undefined,
	input: {
		facultyId: string | null;
		role: AssignableStaffRole;
	},
) {
	if (!actor) {
		return fail(
			"AUTHENTICATION_REQUIRED",
			"You must be signed in to perform this action.",
		);
	}

	if (actor.status !== "active") {
		return fail(
			"FORBIDDEN",
			"You do not have permission to perform this action.",
		);
	}

	if (hasPermission(actor, permissions.manageRoles)) {
		return ok({ scope: "system", userId: actor.userId } as const);
	}

	const facultyAssignment = scopedFacultyAdministratorAssignment(actor);
	if (!facultyAssignment || input.role !== "department_administrator") {
		return fail(
			"FORBIDDEN",
			"You do not have permission to perform this action.",
		);
	}

	if (input.facultyId !== facultyAssignment.facultyId) {
		return fail(
			"FACULTY_SCOPE_FORBIDDEN",
			"Faculty Administrators can only assign departments inside their faculty.",
		);
	}

	return ok({
		scope: "faculty",
		facultyId: facultyAssignment.facultyId,
		userId: actor.userId,
	} satisfies AccessAssignmentAuthorization);
}

function scopedFacultyAdministratorAssignment(
	actor: AuthenticatedActor | null | undefined,
): ScopedFacultyAdministratorAssignment | null {
	if (!actor || actor.status !== "active") {
		return null;
	}

	const assignment = actor.roles.find(
		(roleAssignment) =>
			roleAssignment.role === "faculty_administrator" &&
			Boolean(roleAssignment.facultyId),
	);

	return assignment
		? ({
				...assignment,
				facultyId: assignment.facultyId as string,
			} satisfies ScopedFacultyAdministratorAssignment)
		: null;
}
