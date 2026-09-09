import { describe, expect, it } from "vitest";

import type { AuthenticatedActor } from "#/application/authorization.ts";
import {
	createOrganizationManagementService,
	type ManagedDepartment,
	type ManagedFaculty,
	type OrganizationListFilters,
	type OrganizationManagementRepository,
} from "#/application/organization-management.ts";

const actorId = "00000000-0000-4000-8000-000000000001";
const facultyId = "00000000-0000-4000-8000-000000000010";
const secondFacultyId = "00000000-0000-4000-8000-000000000011";
const departmentId = "00000000-0000-4000-8000-000000000020";
const secondDepartmentId = "00000000-0000-4000-8000-000000000021";

const superAdministrator: AuthenticatedActor = {
	roles: [{ role: "super_administrator" }],
	status: "active",
	userId: actorId,
};

const facultyAdministrator: AuthenticatedActor = {
	roles: [{ facultyId, role: "faculty_administrator" }],
	status: "active",
	userId: "00000000-0000-4000-8000-000000000002",
};

const lecturer: AuthenticatedActor = {
	roles: [{ role: "lecturer" }],
	status: "active",
	userId: "00000000-0000-4000-8000-000000000003",
};

describe("organization management", () => {
	it("lets super administrators create faculties and departments", async () => {
		const { repository } = createRepository();
		const service = createOrganizationManagementService(repository);

		const facultyResult = await service.createFaculty(superAdministrator, {
			code: "eng",
			name: "Faculty of Technology",
		});
		const departmentResult = await service.createDepartment(superAdministrator, {
			code: "csc",
			facultyId,
			name: "Computer Science",
		});

		expect(facultyResult).toMatchObject({
			ok: true,
			value: { code: "ENG", slug: "faculty-of-technology-2" },
		});
		expect(departmentResult).toMatchObject({
			ok: true,
			value: { code: "CSC", facultyId, slug: "computer-science" },
		});
	});

	it("lets faculty administrators create departments in their own faculty", async () => {
		const { repository } = createRepository();
		const service = createOrganizationManagementService(repository);

		const result = await service.createDepartment(facultyAdministrator, {
			code: "mse",
			name: "Materials Science and Engineering",
		});

		expect(result).toMatchObject({
			ok: true,
			value: {
				code: "MSE",
				facultyId,
				slug: "materials-science-and-engineering",
			},
		});
	});

	it("scopes faculty administrator lists to their faculty", async () => {
		const { repository } = createRepository();
		const service = createOrganizationManagementService(repository);

		const faculties = await service.listFaculties(facultyAdministrator);
		const departments = await service.listDepartments(facultyAdministrator);

		expect(faculties).toMatchObject({
			ok: true,
			value: [expect.objectContaining({ id: facultyId })],
		});
		expect(departments).toMatchObject({
			ok: true,
			value: [expect.objectContaining({ facultyId })],
		});
	});

	it("blocks faculty administrators from updating another faculty department", async () => {
		const { repository, updates } = createRepository();
		const service = createOrganizationManagementService(repository);

		const result = await service.updateDepartment(
			facultyAdministrator,
			secondDepartmentId,
			{
				code: "eco",
				name: "Economics",
			},
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "FACULTY_SCOPE_FORBIDDEN" },
		});
		expect(updates).toHaveLength(0);
	});

	it("denies lecturers from organization management", async () => {
		const { repository } = createRepository();
		const service = createOrganizationManagementService(repository);

		const result = await service.listDepartments(lecturer);

		expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
	});
});

function createRepository() {
	const now = new Date("2025-01-01T00:00:00.000Z");
	const faculties: ManagedFaculty[] = [
		{
			code: "TECH",
			createdAt: now,
			departmentCount: 1,
			description: null,
			id: facultyId,
			name: "Faculty of Technology",
			slug: "faculty-of-technology",
			updatedAt: now,
		},
		{
			code: "SOC",
			createdAt: now,
			departmentCount: 1,
			description: null,
			id: secondFacultyId,
			name: "Faculty of Social Sciences",
			slug: "faculty-of-social-sciences",
			updatedAt: now,
		},
	];
	const departments: ManagedDepartment[] = [
		{
			code: "CPE",
			createdAt: now,
			description: null,
			facultyId,
			facultyName: "Faculty of Technology",
			id: departmentId,
			name: "Computer Engineering",
			slug: "computer-engineering",
			updatedAt: now,
		},
		{
			code: "ECO",
			createdAt: now,
			description: null,
			facultyId: secondFacultyId,
			facultyName: "Faculty of Social Sciences",
			id: secondDepartmentId,
			name: "Economics",
			slug: "economics",
			updatedAt: now,
		},
	];
	const updates: unknown[] = [];

	const repository: OrganizationManagementRepository = {
		async createDepartment(input) {
			const department: ManagedDepartment = {
				code: input.code,
				createdAt: now,
				description: input.description,
				facultyId: input.facultyId,
				facultyName:
					faculties.find((faculty) => faculty.id === input.facultyId)?.name ??
					"Unknown faculty",
				id: "00000000-0000-4000-8000-000000000030",
				name: input.name,
				slug: input.slug,
				updatedAt: now,
			};
			departments.push(department);
			return department;
		},
		async createFaculty(input) {
			const faculty: ManagedFaculty = {
				code: input.code,
				createdAt: now,
				departmentCount: 0,
				description: input.description,
				id: "00000000-0000-4000-8000-000000000031",
				name: input.name,
				slug: input.slug,
				updatedAt: now,
			};
			faculties.push(faculty);
			return faculty;
		},
		async departmentCodeExists(code, excludeId) {
			return departments.some(
				(department) =>
					department.code === code && (!excludeId || department.id !== excludeId),
			);
		},
		async departmentSlugExists(slug, excludeId) {
			return departments.some(
				(department) =>
					department.slug === slug && (!excludeId || department.id !== excludeId),
			);
		},
		async facultyCodeExists(code, excludeId) {
			return faculties.some(
				(faculty) => faculty.code === code && (!excludeId || faculty.id !== excludeId),
			);
		},
		async facultySlugExists(slug, excludeId) {
			return faculties.some(
				(faculty) => faculty.slug === slug && (!excludeId || faculty.id !== excludeId),
			);
		},
		async findDepartmentById(id) {
			return departments.find((department) => department.id === id) ?? null;
		},
		async findFacultyById(id) {
			return faculties.find((faculty) => faculty.id === id) ?? null;
		},
		async listDepartments(filters = {}) {
			return departments.filter((department) => matchesDepartment(department, filters));
		},
		async listFaculties(filters = {}) {
			return faculties.filter((faculty) => matchesFaculty(faculty, filters));
		},
		async updateDepartment(input) {
			updates.push(input);
			const department = departments.find((item) => item.id === input.id);
			if (!department) throw new Error("Missing department.");
			Object.assign(department, {
				code: input.code,
				description: input.description,
				facultyId: input.facultyId,
				name: input.name,
				slug: input.slug,
			});
			return department;
		},
		async updateFaculty(input) {
			updates.push(input);
			const faculty = faculties.find((item) => item.id === input.id);
			if (!faculty) throw new Error("Missing faculty.");
			Object.assign(faculty, {
				code: input.code,
				description: input.description,
				name: input.name,
				slug: input.slug,
			});
			return faculty;
		},
	};

	return { departments, faculties, repository, updates };
}

function matchesDepartment(
	department: ManagedDepartment,
	filters: OrganizationListFilters,
) {
	if (filters.facultyId && department.facultyId !== filters.facultyId) {
		return false;
	}

	return matchesSearch(
		[department.name, department.code, department.description, department.facultyName],
		filters.search,
	);
}

function matchesFaculty(faculty: ManagedFaculty, filters: OrganizationListFilters) {
	if (filters.facultyId && faculty.id !== filters.facultyId) return false;
	return matchesSearch([faculty.name, faculty.code, faculty.description], filters.search);
}

function matchesSearch(values: Array<string | null>, search: string | null | undefined) {
	const normalized = search?.trim().toLowerCase();
	if (!normalized) return true;
	return values
		.filter((value): value is string => Boolean(value))
		.some((value) => value.toLowerCase().includes(normalized));
}
