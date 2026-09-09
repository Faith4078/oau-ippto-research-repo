import type { EntityId } from "#/domain/common.ts";
import type { Department, Faculty } from "#/domain/organization.ts";
import { permissions } from "#/domain/permissions.ts";

import {
	type ActorRoleAssignment,
	type AuthenticatedActor,
	hasPermission,
} from "./authorization.ts";
import { fail, ok, type Result } from "./result.ts";

export type ManagedFaculty = Pick<
	Faculty,
	"code" | "createdAt" | "description" | "id" | "name" | "slug" | "updatedAt"
> & {
	departmentCount: number;
};

export type ManagedDepartment = Pick<
	Department,
	| "code"
	| "createdAt"
	| "description"
	| "facultyId"
	| "id"
	| "name"
	| "slug"
	| "updatedAt"
> & {
	facultyName: string;
};

export type OrganizationListFilters = {
	facultyId?: EntityId | null;
	search?: string | null;
};

export type FacultyWriteInput = {
	code?: string | null;
	description?: string | null;
	name: string;
};

export type DepartmentWriteInput = FacultyWriteInput & {
	facultyId?: EntityId | null;
};

export type OrganizationManagementRepository = {
	createDepartment(
		input: DepartmentPersistenceInput,
	): Promise<ManagedDepartment>;
	createFaculty(input: FacultyPersistenceInput): Promise<ManagedFaculty>;
	departmentCodeExists(code: string, excludeId?: EntityId): Promise<boolean>;
	departmentSlugExists(slug: string, excludeId?: EntityId): Promise<boolean>;
	facultyCodeExists(code: string, excludeId?: EntityId): Promise<boolean>;
	facultySlugExists(slug: string, excludeId?: EntityId): Promise<boolean>;
	findDepartmentById(departmentId: EntityId): Promise<ManagedDepartment | null>;
	findFacultyById(facultyId: EntityId): Promise<ManagedFaculty | null>;
	listDepartments(
		filters?: OrganizationListFilters,
	): Promise<readonly ManagedDepartment[]>;
	listFaculties(
		filters?: OrganizationListFilters,
	): Promise<readonly ManagedFaculty[]>;
	updateDepartment(
		input: DepartmentPersistenceInput,
	): Promise<ManagedDepartment>;
	updateFaculty(input: FacultyPersistenceInput): Promise<ManagedFaculty>;
};

type FacultyPersistenceInput = NormalizedOrganizationUnit & {
	actorId: EntityId;
	id?: EntityId;
	slug: string;
};

type DepartmentPersistenceInput = FacultyPersistenceInput & {
	facultyId: EntityId;
};

type NormalizedOrganizationUnit = {
	code: string | null;
	description: string | null;
	name: string;
};

type ScopedFacultyAdministratorAssignment = ActorRoleAssignment & {
	facultyId: EntityId;
};

export function createOrganizationManagementService(
	repository: OrganizationManagementRepository,
) {
	return {
		async createDepartment(
			actor: AuthenticatedActor | null | undefined,
			input: DepartmentWriteInput,
		) {
			const actorGuard = requireActiveActor(actor);
			if (!actorGuard.ok) return actorGuard;

			const normalized = normalizeOrganizationUnit(input);
			if (!normalized.ok) return normalized;

			const facultyResolution = await resolveDepartmentFaculty(
				repository,
				actorGuard.value,
				input.facultyId ?? null,
			);
			if (!facultyResolution.ok) return facultyResolution;

			const slug = await uniqueSlug(normalized.value.name, (candidate) =>
				repository.departmentSlugExists(candidate),
			);
			const codeConflict = await hasCodeConflict(
				normalized.value.code,
				repository.departmentCodeExists.bind(repository),
			);
			if (codeConflict) {
				return fail(
					"DEPARTMENT_CODE_CONFLICT",
					"A department already uses that code.",
				);
			}

			return ok(
				await repository.createDepartment({
					...normalized.value,
					actorId: actorGuard.value.userId,
					facultyId: facultyResolution.value,
					slug,
				}),
			);
		},

		async createFaculty(
			actor: AuthenticatedActor | null | undefined,
			input: FacultyWriteInput,
		) {
			const authorization = requireOrganizationManager(actor);
			if (!authorization.ok) return authorization;

			const normalized = normalizeOrganizationUnit(input);
			if (!normalized.ok) return normalized;

			const slug = await uniqueSlug(normalized.value.name, (candidate) =>
				repository.facultySlugExists(candidate),
			);
			const codeConflict = await hasCodeConflict(
				normalized.value.code,
				repository.facultyCodeExists.bind(repository),
			);
			if (codeConflict) {
				return fail(
					"FACULTY_CODE_CONFLICT",
					"A faculty already uses that code.",
				);
			}

			return ok(
				await repository.createFaculty({
					...normalized.value,
					actorId: authorization.value.userId,
					slug,
				}),
			);
		},

		async listDepartments(
			actor: AuthenticatedActor | null | undefined,
			filters: OrganizationListFilters = {},
		) {
			const actorGuard = requireActiveActor(actor);
			if (!actorGuard.ok) return actorGuard;

			if (isOrganizationManager(actorGuard.value)) {
				return ok(await repository.listDepartments(filters));
			}

			const facultyAssignment = scopedFacultyAdministratorAssignment(
				actorGuard.value,
			);
			if (!facultyAssignment) return forbidden();

			return ok(
				await repository.listDepartments({
					...filters,
					facultyId: facultyAssignment.facultyId,
				}),
			);
		},

		async listFaculties(
			actor: AuthenticatedActor | null | undefined,
			filters: OrganizationListFilters = {},
		) {
			const actorGuard = requireActiveActor(actor);
			if (!actorGuard.ok) return actorGuard;

			if (isOrganizationManager(actorGuard.value)) {
				return ok(await repository.listFaculties(filters));
			}

			const facultyAssignment = scopedFacultyAdministratorAssignment(
				actorGuard.value,
			);
			if (!facultyAssignment) return forbidden();

			return ok(
				await repository.listFaculties({
					...filters,
					facultyId: facultyAssignment.facultyId,
				}),
			);
		},

		async updateDepartment(
			actor: AuthenticatedActor | null | undefined,
			departmentId: EntityId,
			input: DepartmentWriteInput,
		) {
			const actorGuard = requireActiveActor(actor);
			if (!actorGuard.ok) return actorGuard;

			const department = await repository.findDepartmentById(departmentId);
			if (!department) {
				return fail("DEPARTMENT_NOT_FOUND", "Department was not found.");
			}

			const normalized = normalizeOrganizationUnit(input);
			if (!normalized.ok) return normalized;

			const facultyResolution = await resolveUpdatedDepartmentFaculty(
				repository,
				actorGuard.value,
				department,
				input.facultyId ?? null,
			);
			if (!facultyResolution.ok) return facultyResolution;

			const slug = await uniqueSlug(normalized.value.name, (candidate) =>
				repository.departmentSlugExists(candidate, departmentId),
			);
			const codeConflict = await hasCodeConflict(
				normalized.value.code,
				(code, excludeId) => repository.departmentCodeExists(code, excludeId),
				departmentId,
			);
			if (codeConflict) {
				return fail(
					"DEPARTMENT_CODE_CONFLICT",
					"A department already uses that code.",
				);
			}

			return ok(
				await repository.updateDepartment({
					...normalized.value,
					actorId: actorGuard.value.userId,
					facultyId: facultyResolution.value,
					id: departmentId,
					slug,
				}),
			);
		},

		async updateFaculty(
			actor: AuthenticatedActor | null | undefined,
			facultyId: EntityId,
			input: FacultyWriteInput,
		) {
			const authorization = requireOrganizationManager(actor);
			if (!authorization.ok) return authorization;

			const faculty = await repository.findFacultyById(facultyId);
			if (!faculty) return fail("FACULTY_NOT_FOUND", "Faculty was not found.");

			const normalized = normalizeOrganizationUnit(input);
			if (!normalized.ok) return normalized;

			const slug = await uniqueSlug(normalized.value.name, (candidate) =>
				repository.facultySlugExists(candidate, facultyId),
			);
			const codeConflict = await hasCodeConflict(
				normalized.value.code,
				(code, excludeId) => repository.facultyCodeExists(code, excludeId),
				facultyId,
			);
			if (codeConflict) {
				return fail(
					"FACULTY_CODE_CONFLICT",
					"A faculty already uses that code.",
				);
			}

			return ok(
				await repository.updateFaculty({
					...normalized.value,
					actorId: authorization.value.userId,
					id: facultyId,
					slug,
				}),
			);
		},
	};
}

function forbidden(): Result<never> {
	return fail(
		"FORBIDDEN",
		"You do not have permission to manage organization records.",
	);
}

function hasCodeConflict(
	code: string | null,
	exists: (code: string, excludeId?: EntityId) => Promise<boolean>,
	excludeId?: EntityId,
): Promise<boolean> {
	return code ? exists(code, excludeId) : Promise.resolve(false);
}

function isOrganizationManager(actor: AuthenticatedActor): boolean {
	return hasPermission(actor, permissions.manageOrganization);
}

function normalizeCode(code: string | null | undefined) {
	const normalized = code?.trim().toUpperCase() ?? "";
	return normalized.length > 0 ? normalized : null;
}

function normalizeDescription(description: string | null | undefined) {
	const normalized = description?.trim() ?? "";
	return normalized.length > 0 ? normalized : null;
}

function normalizeName(name: string) {
	return name.trim().replace(/\s+/g, " ");
}

function normalizeOrganizationUnit(
	input: FacultyWriteInput,
): Result<NormalizedOrganizationUnit> {
	const name = normalizeName(input.name);
	const code = normalizeCode(input.code);
	const description = normalizeDescription(input.description);

	if (name.length < 2) {
		return fail(
			"VALIDATION_FAILED",
			"Organization names must include at least two characters.",
		);
	}

	if (code && code.length > 32) {
		return fail(
			"VALIDATION_FAILED",
			"Organization codes must be 32 characters or fewer.",
		);
	}

	if (description && description.length > 1000) {
		return fail(
			"VALIDATION_FAILED",
			"Descriptions must be 1000 characters or fewer.",
		);
	}

	return ok({ code, description, name });
}

function requireActiveActor(
	actor: AuthenticatedActor | null | undefined,
): Result<AuthenticatedActor> {
	if (!actor) {
		return fail(
			"AUTHENTICATION_REQUIRED",
			"You must be signed in to perform this action.",
		);
	}

	if (actor.status !== "active") {
		return fail("FORBIDDEN", "Your account must be active to manage records.");
	}

	return ok(actor);
}

function requireOrganizationManager(
	actor: AuthenticatedActor | null | undefined,
): Result<AuthenticatedActor> {
	const actorGuard = requireActiveActor(actor);
	if (!actorGuard.ok) return actorGuard;

	if (!isOrganizationManager(actorGuard.value)) {
		return forbidden();
	}

	return actorGuard;
}

async function resolveDepartmentFaculty(
	repository: OrganizationManagementRepository,
	actor: AuthenticatedActor,
	requestedFacultyId: EntityId | null,
): Promise<Result<EntityId>> {
	if (isOrganizationManager(actor)) {
		if (!requestedFacultyId) {
			return fail(
				"FACULTY_SCOPE_REQUIRED",
				"Choose the faculty this department belongs to.",
			);
		}

		return requireExistingFaculty(repository, requestedFacultyId);
	}

	const facultyAssignment = scopedFacultyAdministratorAssignment(actor);
	if (!facultyAssignment) return forbidden();

	if (
		requestedFacultyId &&
		requestedFacultyId !== facultyAssignment.facultyId
	) {
		return fail(
			"FACULTY_SCOPE_FORBIDDEN",
			"Faculty Administrators can only manage departments inside their faculty.",
		);
	}

	return requireExistingFaculty(repository, facultyAssignment.facultyId);
}

async function resolveUpdatedDepartmentFaculty(
	repository: OrganizationManagementRepository,
	actor: AuthenticatedActor,
	department: ManagedDepartment,
	requestedFacultyId: EntityId | null,
): Promise<Result<EntityId>> {
	if (isOrganizationManager(actor)) {
		return requireExistingFaculty(
			repository,
			requestedFacultyId ?? department.facultyId,
		);
	}

	const facultyAssignment = scopedFacultyAdministratorAssignment(actor);
	if (!facultyAssignment) return forbidden();

	if (department.facultyId !== facultyAssignment.facultyId) {
		return fail(
			"FACULTY_SCOPE_FORBIDDEN",
			"Faculty Administrators can only manage departments inside their faculty.",
		);
	}

	if (
		requestedFacultyId &&
		requestedFacultyId !== facultyAssignment.facultyId
	) {
		return fail(
			"FACULTY_SCOPE_FORBIDDEN",
			"Faculty Administrators cannot move departments to another faculty.",
		);
	}

	return ok(facultyAssignment.facultyId);
}

async function requireExistingFaculty(
	repository: OrganizationManagementRepository,
	facultyId: EntityId,
): Promise<Result<EntityId>> {
	const faculty = await repository.findFacultyById(facultyId);
	if (!faculty) return fail("FACULTY_NOT_FOUND", "Faculty was not found.");
	return ok(facultyId);
}

function scopedFacultyAdministratorAssignment(
	actor: AuthenticatedActor | null | undefined,
): ScopedFacultyAdministratorAssignment | null {
	if (!actor || actor.status !== "active") return null;

	const assignment = actor.roles.find(
		(roleAssignment) =>
			roleAssignment.role === "faculty_administrator" &&
			Boolean(roleAssignment.facultyId),
	);

	return assignment
		? ({
				...assignment,
				facultyId: assignment.facultyId as EntityId,
			} satisfies ScopedFacultyAdministratorAssignment)
		: null;
}

function slugify(value: string) {
	const slug = value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || "organization-unit";
}

async function uniqueSlug(
	name: string,
	exists: (slug: string) => Promise<boolean>,
) {
	const baseSlug = slugify(name);
	let slug = baseSlug;
	let suffix = 2;

	while (await exists(slug)) {
		slug = `${baseSlug}-${suffix}`;
		suffix += 1;
	}

	return slug;
}
