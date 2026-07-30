import type { RoleKey } from "#/domain/organization.ts";

export type PermissionKey =
	| "public:read"
	| "dashboard:access"
	| "research:create"
	| "research:read-own"
	| "research:update-own-draft"
	| "research:submit"
	| "research:review-department"
	| "research:review-faculty"
	| "research:publish"
	| "research:read-private"
	| "files:create-upload-url"
	| "files:create-download-url"
	| "innovation:manage"
	| "patent:manage"
	| "commercialization:manage"
	| "users:manage"
	| "roles:manage"
	| "organization:manage"
	| "audit:read"
	| "jobs:read";

export const applicationPermissions = [
	"public:read",
	"dashboard:access",
	"research:create",
	"research:read-own",
	"research:update-own-draft",
	"research:submit",
	"research:review-department",
	"research:review-faculty",
	"research:publish",
	"research:read-private",
	"files:create-upload-url",
	"files:create-download-url",
	"innovation:manage",
	"patent:manage",
	"commercialization:manage",
	"users:manage",
	"roles:manage",
	"organization:manage",
	"audit:read",
	"jobs:read",
] as const satisfies readonly PermissionKey[];

export const applicationRoles = [
	"visitor",
	"lecturer",
	"department_administrator",
	"faculty_administrator",
	"iptto_officer",
	"super_administrator",
] as const satisfies readonly RoleKey[];

export const rolePermissions = {
	visitor: ["public:read"],
	lecturer: [
		"public:read",
		"dashboard:access",
		"research:create",
		"research:read-own",
		"research:update-own-draft",
		"research:submit",
		"files:create-upload-url",
		"files:create-download-url",
	],
	department_administrator: [
		"public:read",
		"dashboard:access",
		"research:read-own",
		"research:review-department",
		"research:read-private",
		"files:create-download-url",
	],
	faculty_administrator: [
		"public:read",
		"dashboard:access",
		"research:read-own",
		"research:review-department",
		"research:review-faculty",
		"research:read-private",
		"files:create-download-url",
	],
	iptto_officer: [
		"public:read",
		"dashboard:access",
		"research:read-private",
		"files:create-download-url",
		"innovation:manage",
		"patent:manage",
		"commercialization:manage",
	],
	super_administrator: applicationPermissions,
} as const satisfies Record<RoleKey, readonly PermissionKey[]>;

export function getPermissionsForRoles(
	roles: readonly RoleKey[],
): ReadonlySet<PermissionKey> {
	return new Set(roles.flatMap((role) => rolePermissions[role]));
}

export function hasPermission(
	roles: readonly RoleKey[],
	permission: PermissionKey,
): boolean {
	return getPermissionsForRoles(roles).has(permission);
}

export function hasEveryPermission(
	roles: readonly RoleKey[],
	permissions: readonly PermissionKey[],
): boolean {
	const grantedPermissions = getPermissionsForRoles(roles);
	return permissions.every((permission) => grantedPermissions.has(permission));
}

export function hasAnyPermission(
	roles: readonly RoleKey[],
	permissions: readonly PermissionKey[],
): boolean {
	const grantedPermissions = getPermissionsForRoles(roles);
	return permissions.some((permission) => grantedPermissions.has(permission));
}
