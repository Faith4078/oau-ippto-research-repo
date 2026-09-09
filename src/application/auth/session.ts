import type { EntityId } from "#/domain/common.ts";
import type { RoleKey, UserStatus } from "#/domain/organization.ts";

import {
	type applicationRoles,
	getPermissionsForRoles,
	type PermissionKey,
} from "./permissions.ts";

export type AuthRole = (typeof applicationRoles)[number];

export type AuthRoleAssignment = {
	role: RoleKey;
	departmentId: EntityId | null;
	facultyId: EntityId | null;
};

export type AuthUser = {
	id: EntityId;
	staffId: string;
	email: string | null;
	name: string;
	status: UserStatus;
	roles: readonly RoleKey[];
	roleAssignments: readonly AuthRoleAssignment[];
	departmentId: EntityId | null;
	facultyId: EntityId | null;
};

export type AuthSession = {
	id: EntityId;
	user: AuthUser;
	expiresAt: Date;
	issuedAt: Date | null;
};

export type SessionState =
	| {
			status: "authenticated";
			session: AuthSession;
	  }
	| {
			status: "anonymous";
			session: null;
	  };

export type SessionReader<RequestLike = unknown> = (
	request: RequestLike,
) => Promise<SessionState> | SessionState;

export function createAnonymousSessionState(): SessionState {
	return {
		status: "anonymous",
		session: null,
	};
}

export function createAuthenticatedSessionState(
	session: AuthSession,
): SessionState {
	return {
		status: "authenticated",
		session,
	};
}

export function isSessionExpired(
	session: Pick<AuthSession, "expiresAt">,
	now = new Date(),
): boolean {
	return session.expiresAt.getTime() <= now.getTime();
}

export function isActiveSession(
	session: AuthSession,
	now = new Date(),
): boolean {
	return session.user.status === "active" && !isSessionExpired(session, now);
}

export function getSessionPermissions(
	session: Pick<AuthSession, "user">,
): ReadonlySet<PermissionKey> {
	return getPermissionsForRoles(session.user.roles);
}
