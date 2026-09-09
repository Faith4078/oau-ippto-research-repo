import type { RoleKey } from "./organization.ts";

export const permissions = {
	viewPublicResearch: "research:view_public",
	viewRestrictedResearch: "research:view_restricted",
	viewPrivateResearch: "research:view_private",
	submitResearch: "research:submit",
	editOwnResearchDraft: "research:edit_own_draft",
	deleteOwnResearchDraft: "research:delete_own_draft",
	reviewDepartmentResearch: "research:review_department",
	reviewFacultyResearch: "research:review_faculty",
	reviewIpttoResearch: "research:review_iptto",
	approveResearch: "research:approve",
	rejectResearch: "research:reject",
	publishResearch: "research:publish",
	archiveResearch: "research:archive",
	createFileUploadUrl: "files:create_upload_url",
	createFileDownloadUrl: "files:create_download_url",
	createInnovation: "innovation:create",
	editInnovation: "innovation:edit",
	reviewInnovation: "innovation:review",
	publishInnovation: "innovation:publish",
	archiveInnovation: "innovation:archive",
	managePatent: "patent:manage",
	manageCommercialization: "commercialization:manage",
	viewAuditLog: "audit:view",
	manageUsers: "admin:manage_users",
	manageRoles: "admin:manage_roles",
	manageOrganization: "admin:manage_organization",
	manageSystemSettings: "admin:manage_system_settings",
} as const;

export type PermissionKey = (typeof permissions)[keyof typeof permissions];

export const systemRoles = {
	visitor: "visitor",
	lecturer: "lecturer",
	departmentAdministrator: "department_administrator",
	facultyAdministrator: "faculty_administrator",
	ipttoOfficer: "iptto_officer",
	superAdministrator: "super_administrator",
} as const satisfies Record<string, RoleKey>;

export const rolePermissions = {
	visitor: [permissions.viewPublicResearch],
	lecturer: [
		permissions.viewPublicResearch,
		permissions.viewRestrictedResearch,
		permissions.submitResearch,
		permissions.editOwnResearchDraft,
		permissions.deleteOwnResearchDraft,
		permissions.createInnovation,
		permissions.editInnovation,
		permissions.createFileUploadUrl,
		permissions.createFileDownloadUrl,
	],
	department_administrator: [
		permissions.viewPublicResearch,
		permissions.viewRestrictedResearch,
		permissions.submitResearch,
		permissions.editOwnResearchDraft,
		permissions.deleteOwnResearchDraft,
		permissions.reviewDepartmentResearch,
		permissions.approveResearch,
		permissions.rejectResearch,
		permissions.createInnovation,
		permissions.editInnovation,
		permissions.reviewInnovation,
		permissions.createFileUploadUrl,
		permissions.createFileDownloadUrl,
	],
	faculty_administrator: [
		permissions.viewPublicResearch,
		permissions.viewRestrictedResearch,
		permissions.reviewFacultyResearch,
		permissions.approveResearch,
		permissions.rejectResearch,
		permissions.reviewInnovation,
		permissions.createFileDownloadUrl,
	],
	iptto_officer: [
		permissions.viewPublicResearch,
		permissions.viewRestrictedResearch,
		permissions.viewPrivateResearch,
		permissions.reviewIpttoResearch,
		permissions.approveResearch,
		permissions.rejectResearch,
		permissions.publishResearch,
		permissions.archiveResearch,
		permissions.reviewInnovation,
		permissions.publishInnovation,
		permissions.archiveInnovation,
		permissions.managePatent,
		permissions.manageCommercialization,
		permissions.createFileDownloadUrl,
		permissions.viewAuditLog,
	],
	super_administrator: Object.values(permissions),
} as const satisfies Record<RoleKey, readonly PermissionKey[]>;

export function getPermissionsForRoles(
	roles: readonly RoleKey[],
): Set<PermissionKey> {
	return new Set(roles.flatMap((role) => rolePermissions[role] ?? []));
}

export function roleHasPermission(
	role: RoleKey,
	permission: PermissionKey,
): boolean {
	return getPermissionsForRoles([role]).has(permission);
}
