import type { AccessLevel, EntityId, ResearchRecord } from "../domain/index.ts";
import type { RoleKey, UserStatus } from "../domain/organization.ts";
import {
	getPermissionsForRoles,
	type PermissionKey,
	permissions,
} from "../domain/permissions.ts";
import { fail, ok, type Result } from "./result.ts";

export type ActorRoleAssignment = {
	role: RoleKey;
	facultyId?: EntityId | null;
	departmentId?: EntityId | null;
};

export type AuthenticatedActor = {
	userId: EntityId;
	status: UserStatus;
	roles: readonly ActorRoleAssignment[];
};

export type AuthorizationScope = {
	facultyId?: EntityId | null;
	departmentId?: EntityId | null;
	ownerId?: EntityId | null;
};

export function getActorPermissions(
	actor: AuthenticatedActor,
): Set<PermissionKey> {
	return getPermissionsForRoles(
		actor.roles.map((assignment) => assignment.role),
	);
}

export function hasPermission(
	actor: AuthenticatedActor | null | undefined,
	permission: PermissionKey,
	scope: AuthorizationScope = {},
): boolean {
	if (!actor || actor.status !== "active") {
		return false;
	}

	const actorPermissions = getActorPermissions(actor);

	if (!actorPermissions.has(permission)) {
		return false;
	}

	if (actorPermissions.has(permissions.manageSystemSettings)) {
		return true;
	}

	return actor.roles.some((assignment) => roleScopeMatches(assignment, scope));
}

export function requirePermission(
	actor: AuthenticatedActor | null | undefined,
	permission: PermissionKey,
	scope?: AuthorizationScope,
): Result<AuthenticatedActor> {
	if (!actor) {
		return fail(
			"AUTHENTICATION_REQUIRED",
			"You must be signed in to perform this action.",
		);
	}

	if (!hasPermission(actor, permission, scope)) {
		return fail(
			"FORBIDDEN",
			"You do not have permission to perform this action.",
		);
	}

	return ok(actor);
}

export function requireAnyPermission(
	actor: AuthenticatedActor | null | undefined,
	requiredPermissions: readonly PermissionKey[],
	scope?: AuthorizationScope,
): Result<AuthenticatedActor> {
	if (!actor) {
		return fail(
			"AUTHENTICATION_REQUIRED",
			"You must be signed in to perform this action.",
		);
	}

	if (
		requiredPermissions.some((permission) =>
			hasPermission(actor, permission, scope),
		)
	) {
		return ok(actor);
	}

	return fail(
		"FORBIDDEN",
		"You do not have permission to perform this action.",
	);
}

export function canAccessResearchRecord(
	actor: AuthenticatedActor | null | undefined,
	record: Pick<
		ResearchRecord,
		"accessLevel" | "facultyId" | "departmentId" | "ownerId"
	>,
): boolean {
	if (record.accessLevel === "public") {
		return true;
	}

	if (record.ownerId && actor?.userId === record.ownerId) {
		return true;
	}

	return hasPermission(actor, permissionForAccessLevel(record.accessLevel), {
		facultyId: record.facultyId,
		departmentId: record.departmentId,
		ownerId: record.ownerId,
	});
}

export function permissionForAccessLevel(
	accessLevel: AccessLevel,
): PermissionKey {
	if (accessLevel === "private") {
		return permissions.viewPrivateResearch;
	}

	if (accessLevel === "restricted") {
		return permissions.viewRestrictedResearch;
	}

	return permissions.viewPublicResearch;
}

function roleScopeMatches(
	assignment: ActorRoleAssignment,
	scope: AuthorizationScope,
): boolean {
	if (!scope.facultyId && !scope.departmentId && !scope.ownerId) {
		return true;
	}

	if (assignment.role === "super_administrator") {
		return true;
	}

	if (assignment.departmentId) {
		return scope.departmentId === assignment.departmentId;
	}

	if (assignment.facultyId) {
		return scope.facultyId === assignment.facultyId;
	}

	return !assignment.departmentId && !assignment.facultyId;
}
