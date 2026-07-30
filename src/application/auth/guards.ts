import { fail, ok, type Result } from "#/application/result.ts";
import type { RoleKey } from "#/domain/organization.ts";

import {
	hasAnyPermission,
	hasEveryPermission,
	type PermissionKey,
} from "./permissions.ts";
import {
	type AuthSession,
	isActiveSession,
	type SessionReader,
	type SessionState,
} from "./session.ts";

export type AuthorizationRequirement = {
	roles?: readonly RoleKey[];
	permissions?: readonly PermissionKey[];
	match?: "any" | "every";
};

export type AuthorizedSession = {
	session: AuthSession;
};

export type AuthGuardFailureCode =
	| "AUTH_UNAUTHENTICATED"
	| "AUTH_SESSION_EXPIRED"
	| "AUTH_USER_INACTIVE"
	| "AUTH_FORBIDDEN";

export class AuthorizationError extends Error {
	readonly code: AuthGuardFailureCode;
	readonly statusCode: 401 | 403;

	constructor(code: AuthGuardFailureCode, message: string) {
		super(message);
		this.name = "AuthorizationError";
		this.code = code;
		this.statusCode = code === "AUTH_FORBIDDEN" ? 403 : 401;
	}
}

export function authorizeSession(
	sessionState: SessionState,
	requirement: AuthorizationRequirement = {},
	now = new Date(),
): Result<AuthorizedSession> {
	if (sessionState.status !== "authenticated") {
		return fail("AUTH_UNAUTHENTICATED", "Sign in is required.");
	}

	const { session } = sessionState;

	if (session.user.status !== "active") {
		return fail("AUTH_USER_INACTIVE", "The signed-in account is not active.");
	}

	if (!isActiveSession(session, now)) {
		return fail("AUTH_SESSION_EXPIRED", "The auth session has expired.");
	}

	if (requirement.roles?.length) {
		const hasAllowedRole = requirement.roles.some((role) =>
			session.user.roles.includes(role),
		);

		if (!hasAllowedRole) {
			return fail(
				"AUTH_FORBIDDEN",
				"The signed-in account lacks a required role.",
			);
		}
	}

	if (requirement.permissions?.length) {
		const matcher =
			requirement.match === "every" ? hasEveryPermission : hasAnyPermission;
		const hasRequiredPermissions = matcher(
			session.user.roles,
			requirement.permissions,
		);

		if (!hasRequiredPermissions) {
			return fail(
				"AUTH_FORBIDDEN",
				"The signed-in account lacks a required permission.",
			);
		}
	}

	return ok({ session });
}

export function assertAuthorizedSession(
	sessionState: SessionState,
	requirement: AuthorizationRequirement = {},
	now = new Date(),
): AuthorizedSession {
	const result = authorizeSession(sessionState, requirement, now);

	if (result.ok) {
		return result.value;
	}

	throw new AuthorizationError(
		result.error.code as AuthGuardFailureCode,
		result.error.message,
	);
}

export function createProtectedRouteGuard<RouteContext>(
	readSession: SessionReader<RouteContext>,
	requirement: AuthorizationRequirement = {},
) {
	return async (context: RouteContext): Promise<AuthorizedSession> => {
		const sessionState = await readSession(context);
		return assertAuthorizedSession(sessionState, requirement);
	};
}

export function requirePermission(permission: PermissionKey) {
	return {
		permissions: [permission],
		match: "every",
	} as const satisfies AuthorizationRequirement;
}

export function requireAnyPermission(
	permissions: readonly PermissionKey[],
): AuthorizationRequirement {
	return {
		permissions,
		match: "any",
	};
}

export function requireRole(role: RoleKey) {
	return {
		roles: [role],
	} as const satisfies AuthorizationRequirement;
}
