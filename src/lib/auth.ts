import type { PermissionKey } from "#/application/auth/permissions.ts";
import {
	applicationPermissions,
	applicationRoles,
	hasPermission,
	rolePermissions,
} from "#/application/auth/permissions.ts";
import type { AuthSession, SessionReader } from "#/application/auth/session.ts";
import type { RoleKey } from "#/domain/organization.ts";

export const staffSignInEndpoint = "/api/auth/sign-in/username";
export const staffSignUpEndpoint = "/api/auth/sign-up";
export const staffPasswordResetRequestEndpoint =
	"/api/auth/staff-password-reset/request";
export const staffPasswordResetCompleteEndpoint =
	"/api/auth/staff-password-reset/complete";

export type StaffSignUpKind = "lecturer" | "iptto";

export type StaffSignInInput = {
	staffId: string;
	password: string;
};

export type StaffSignInPayload = {
	username: string;
	password: string;
};

export type LecturerSignUpInput = {
	kind: "lecturer";
	firstName: string;
	lastName: string;
	staffId: string;
	email: string;
	facultyId: string;
	departmentId: string;
	password: string;
};

export type IpttoSignUpInput = {
	kind: "iptto";
	name: string;
	staffId: string;
	email: string;
	password: string;
};

export type StaffSignUpInput = LecturerSignUpInput | IpttoSignUpInput;

export type StaffSignUpPayload = {
	email: string;
	name: string;
	password: string;
	username: string;
	displayUsername: string;
};

export type StaffIdAuthSession = AuthSession;
export type StaffIdSessionReader<RequestLike = unknown> =
	SessionReader<RequestLike>;

export const betterAuthStaffIdStrategy = {
	identifierLabel: "Staff ID",
	identifierField: "username",
	passwordField: "password",
	endpoint: staffSignInEndpoint,
	plugin: "better-auth/plugins username()",
	status: "runtime-mounted",
	notes:
		"Staff ID maps to Better Auth username. Signup is constrained to lecturers with AC/ IDs and IPTTO staff with AT/ IDs.",
	roles: applicationRoles,
	permissions: applicationPermissions,
	rolePermissions,
} as const;

export function normalizeStaffId(staffId: string) {
	return staffId.trim().toLowerCase();
}

export function buildStaffSignInPayload({
	staffId,
	password,
}: StaffSignInInput): StaffSignInPayload {
	return {
		username: normalizeStaffId(staffId),
		password,
	};
}

export function isLecturerStaffId(staffId: string) {
	return /^ac\/\d{4}$/.test(normalizeStaffId(staffId));
}

export function isAdministrativeStaffId(staffId: string) {
	return /^at\/\d{4}$/.test(normalizeStaffId(staffId));
}

export function buildSyntheticStaffEmail(staffId: string) {
	const emailSafeStaffId = normalizeStaffId(staffId).replace(
		/[^a-z0-9]+/g,
		"-",
	);

	return `auth+${emailSafeStaffId}@oauife.edu.ng`;
}

export function buildStaffSignUpPayload(
	input: StaffSignUpInput,
): StaffSignUpPayload {
	const staffId = normalizeStaffId(input.staffId);
	const name =
		input.kind === "lecturer"
			? `${input.firstName.trim()} ${input.lastName.trim()}`.trim()
			: input.name.trim();

	return {
		email: buildSyntheticStaffEmail(staffId),
		name,
		password: input.password,
		username: staffId,
		displayUsername: input.staffId.trim(),
	};
}

export function staffRoleHasPermission(
	roles: readonly RoleKey[],
	permission: PermissionKey,
) {
	return hasPermission(roles, permission);
}
