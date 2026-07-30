import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

import {
	createAnonymousSessionState,
	createAuthenticatedSessionState,
	type SessionState,
} from "#/application/auth/session.ts";
import { getDatabaseUrl } from "#/db/env.ts";
import type { EntityId } from "#/domain/common.ts";
import type { RoleKey, UserStatus } from "#/domain/organization.ts";
import * as schema from "#/infrastructure/db/schema.ts";

import { normalizeStaffId } from "./auth.ts";
import { auth } from "./auth-runtime.ts";

type BetterAuthSessionPayload = {
	session: {
		id: string;
		createdAt?: Date | string | null;
		expiresAt: Date | string;
	};
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		username?: string | null;
	};
};

export async function readAuthSession(request: Request): Promise<SessionState> {
	const betterAuthSession = (await auth.api.getSession({
		headers: request.headers,
	})) as BetterAuthSessionPayload | null;

	if (!betterAuthSession) {
		return createAnonymousSessionState();
	}

	const staffId = staffIdFromBetterAuthUser(betterAuthSession.user);
	const appUser = await readApplicationUserByStaffId(staffId);

	if (!appUser) {
		return createAuthenticatedSessionState({
			id: betterAuthSession.session.id as EntityId,
			expiresAt: new Date(betterAuthSession.session.expiresAt),
			issuedAt: betterAuthSession.session.createdAt
				? new Date(betterAuthSession.session.createdAt)
				: null,
			user: {
				id: betterAuthSession.user.id as EntityId,
				staffId,
				email: betterAuthSession.user.email ?? null,
				name: betterAuthSession.user.name ?? "Staff user",
				status: "invited",
				roles: [],
				departmentId: null,
				facultyId: null,
			},
		});
	}

	return createAuthenticatedSessionState({
		id: betterAuthSession.session.id as EntityId,
		expiresAt: new Date(betterAuthSession.session.expiresAt),
		issuedAt: betterAuthSession.session.createdAt
			? new Date(betterAuthSession.session.createdAt)
			: null,
		user: appUser,
	});
}

function staffIdFromBetterAuthUser(user: BetterAuthSessionPayload["user"]) {
	if (user.username) {
		return normalizeStaffId(user.username);
	}

	const syntheticStaffId = staffIdFromSyntheticEmail(user.email ?? "");

	return normalizeStaffId(syntheticStaffId ?? user.email ?? "");
}

function staffIdFromSyntheticEmail(email: string) {
	const match = email.match(/^auth\+(?<prefix>ac|at)-(?<value>[^@]+)@/i);

	if (!match?.groups) {
		return null;
	}

	return `${match.groups.prefix}/${match.groups.value}`;
}

async function readApplicationUserByStaffId(staffId: string) {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return null;
	}

	const database = drizzle(databaseUrl, { schema });
	const rows = await database
		.select({
			id: schema.users.id,
			staffId: schema.users.staffId,
			email: schema.users.email,
			name: schema.users.name,
			status: schema.users.status,
			facultyId: schema.userProfiles.facultyId,
			departmentId: schema.userProfiles.departmentId,
			role: schema.roles.key,
		})
		.from(schema.users)
		.leftJoin(
			schema.userProfiles,
			eq(schema.userProfiles.userId, schema.users.id),
		)
		.leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
		.leftJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
		.where(eq(schema.users.staffId, staffId));

	if (!rows.length) {
		return null;
	}

	const first = rows[0];

	if (!first) {
		return null;
	}

	return {
		id: first.id as EntityId,
		staffId: first.staffId,
		email: first.email,
		name: first.name,
		status: first.status as UserStatus,
		roles: Array.from(
			new Set(
				rows
					.map((row) => row.role)
					.filter((role): role is RoleKey => isRoleKey(role)),
			),
		),
		departmentId: (first.departmentId ?? null) as EntityId | null,
		facultyId: (first.facultyId ?? null) as EntityId | null,
	};
}

function isRoleKey(value: string | null): value is RoleKey {
	return (
		value === "visitor" ||
		value === "lecturer" ||
		value === "department_administrator" ||
		value === "faculty_administrator" ||
		value === "iptto_officer" ||
		value === "super_administrator"
	);
}
