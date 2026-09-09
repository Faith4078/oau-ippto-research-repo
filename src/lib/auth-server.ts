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
				roleAssignments: [],
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

let cachedDatabase: ReturnType<typeof drizzle> | undefined;

function getDatabase() {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return undefined;
	}

	if (!cachedDatabase) {
		cachedDatabase = drizzle(databaseUrl, { schema });
	}

	return cachedDatabase;
}

async function readApplicationUserByStaffId(staffId: string) {
	const database = getDatabase();

	if (!database) {
		return null;
	}

	const rows = await database
		.select({
			id: schema.users.id,
			staffId: schema.users.staffId,
			email: schema.users.email,
			name: schema.users.name,
			status: schema.users.status,
			profileFacultyId: schema.userProfiles.facultyId,
			profileDepartmentId: schema.userProfiles.departmentId,
			role: schema.roles.key,
			roleFacultyId: schema.userRoles.facultyId,
			roleDepartmentId: schema.userRoles.departmentId,
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
	const roleAssignments = rows.flatMap((row) =>
		isRoleKey(row.role)
			? [
					{
						role: row.role,
						departmentId: (row.roleDepartmentId ?? null) as EntityId | null,
						facultyId: (row.roleFacultyId ?? null) as EntityId | null,
					},
				]
			: [],
	);

	return {
		id: first.id as EntityId,
		staffId: first.staffId,
		email: first.email,
		name: first.name,
		status: first.status as UserStatus,
		roles: Array.from(
			new Set(roleAssignments.map((assignment) => assignment.role)),
		),
		roleAssignments,
		departmentId: (first.profileDepartmentId ?? null) as EntityId | null,
		facultyId: (first.profileFacultyId ?? null) as EntityId | null,
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
