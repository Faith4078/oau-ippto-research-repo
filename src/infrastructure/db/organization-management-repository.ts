import { and, asc, eq, ilike, ne, or, type SQL, sql } from "drizzle-orm";

import type {
	ManagedDepartment,
	ManagedFaculty,
	OrganizationListFilters,
	OrganizationManagementRepository,
} from "#/application/organization-management.ts";
import type { EntityId } from "#/domain/common.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

const departmentSelection = {
	code: schema.departments.code,
	createdAt: schema.departments.createdAt,
	description: schema.departments.description,
	facultyId: schema.departments.facultyId,
	facultyName: schema.faculties.name,
	id: schema.departments.id,
	name: schema.departments.name,
	slug: schema.departments.slug,
	updatedAt: schema.departments.updatedAt,
};

const facultySelection = {
	code: schema.faculties.code,
	createdAt: schema.faculties.createdAt,
	description: schema.faculties.description,
	id: schema.faculties.id,
	name: schema.faculties.name,
	slug: schema.faculties.slug,
	updatedAt: schema.faculties.updatedAt,
};

export class PostgresOrganizationManagementRepository
	implements OrganizationManagementRepository
{
	constructor(private readonly database: Database) {}

	async createDepartment(input: {
		actorId: EntityId;
		code: string | null;
		description: string | null;
		facultyId: EntityId;
		name: string;
		slug: string;
	}): Promise<ManagedDepartment> {
		return this.database.transaction(async (transaction) => {
			const [department] = await transaction
				.insert(schema.departments)
				.values({
					code: input.code,
					description: input.description,
					facultyId: input.facultyId,
					name: input.name,
					slug: input.slug,
				})
				.returning({
					code: schema.departments.code,
					createdAt: schema.departments.createdAt,
					description: schema.departments.description,
					facultyId: schema.departments.facultyId,
					id: schema.departments.id,
					name: schema.departments.name,
					slug: schema.departments.slug,
					updatedAt: schema.departments.updatedAt,
				});
			if (!department) throw new Error("Department could not be created.");

			await transaction.insert(schema.auditLogs).values({
				action: "organization.department.created",
				actorId: input.actorId,
				metadata: {
					code: input.code,
					facultyId: input.facultyId,
					name: input.name,
				},
				targetId: department.id,
				targetType: "department",
			});

			return {
				...department,
				facultyName: await this.readFacultyName(
					transaction,
					department.facultyId,
				),
			};
		});
	}

	async createFaculty(input: {
		actorId: EntityId;
		code: string | null;
		description: string | null;
		name: string;
		slug: string;
	}): Promise<ManagedFaculty> {
		return this.database.transaction(async (transaction) => {
			const [faculty] = await transaction
				.insert(schema.faculties)
				.values({
					code: input.code,
					description: input.description,
					name: input.name,
					slug: input.slug,
				})
				.returning(facultySelection);
			if (!faculty) throw new Error("Faculty could not be created.");

			await transaction.insert(schema.auditLogs).values({
				action: "organization.faculty.created",
				actorId: input.actorId,
				metadata: { code: input.code, name: input.name },
				targetId: faculty.id,
				targetType: "faculty",
			});

			return { ...faculty, departmentCount: 0 };
		});
	}

	async departmentCodeExists(
		code: string,
		excludeId?: EntityId,
	): Promise<boolean> {
		const [department] = await this.database
			.select({ id: schema.departments.id })
			.from(schema.departments)
			.where(
				and(
					...[
						eq(schema.departments.code, code),
						...(excludeId ? [ne(schema.departments.id, excludeId)] : []),
					],
				),
			)
			.limit(1);

		return Boolean(department);
	}

	async departmentSlugExists(
		slug: string,
		excludeId?: EntityId,
	): Promise<boolean> {
		const [department] = await this.database
			.select({ id: schema.departments.id })
			.from(schema.departments)
			.where(
				and(
					...[
						eq(schema.departments.slug, slug),
						...(excludeId ? [ne(schema.departments.id, excludeId)] : []),
					],
				),
			)
			.limit(1);

		return Boolean(department);
	}

	async facultyCodeExists(
		code: string,
		excludeId?: EntityId,
	): Promise<boolean> {
		const [faculty] = await this.database
			.select({ id: schema.faculties.id })
			.from(schema.faculties)
			.where(
				and(
					...[
						eq(schema.faculties.code, code),
						...(excludeId ? [ne(schema.faculties.id, excludeId)] : []),
					],
				),
			)
			.limit(1);

		return Boolean(faculty);
	}

	async facultySlugExists(
		slug: string,
		excludeId?: EntityId,
	): Promise<boolean> {
		const [faculty] = await this.database
			.select({ id: schema.faculties.id })
			.from(schema.faculties)
			.where(
				and(
					...[
						eq(schema.faculties.slug, slug),
						...(excludeId ? [ne(schema.faculties.id, excludeId)] : []),
					],
				),
			)
			.limit(1);

		return Boolean(faculty);
	}

	async findDepartmentById(
		departmentId: EntityId,
	): Promise<ManagedDepartment | null> {
		const [department] = await this.database
			.select(departmentSelection)
			.from(schema.departments)
			.innerJoin(
				schema.faculties,
				eq(schema.faculties.id, schema.departments.facultyId),
			)
			.where(eq(schema.departments.id, departmentId))
			.limit(1);

		return department ?? null;
	}

	async findFacultyById(facultyId: EntityId): Promise<ManagedFaculty | null> {
		const [faculty] = await this.database
			.select(facultySelection)
			.from(schema.faculties)
			.where(eq(schema.faculties.id, facultyId))
			.limit(1);

		if (!faculty) return null;

		return {
			...faculty,
			departmentCount: await this.departmentCountForFaculty(faculty.id),
		};
	}

	async listDepartments(
		filters: OrganizationListFilters = {},
	): Promise<readonly ManagedDepartment[]> {
		const where = departmentWhere(filters);
		return where
			? this.database
					.select(departmentSelection)
					.from(schema.departments)
					.innerJoin(
						schema.faculties,
						eq(schema.faculties.id, schema.departments.facultyId),
					)
					.where(where)
					.orderBy(asc(schema.faculties.name), asc(schema.departments.name))
			: this.database
					.select(departmentSelection)
					.from(schema.departments)
					.innerJoin(
						schema.faculties,
						eq(schema.faculties.id, schema.departments.facultyId),
					)
					.orderBy(asc(schema.faculties.name), asc(schema.departments.name));
	}

	async listFaculties(
		filters: OrganizationListFilters = {},
	): Promise<readonly ManagedFaculty[]> {
		const where = facultyWhere(filters);
		const [faculties, departmentCounts] = await Promise.all([
			where
				? this.database
						.select(facultySelection)
						.from(schema.faculties)
						.where(where)
						.orderBy(asc(schema.faculties.name))
				: this.database
						.select(facultySelection)
						.from(schema.faculties)
						.orderBy(asc(schema.faculties.name)),
			this.database
				.select({
					count: sql<number>`count(*)::int`,
					facultyId: schema.departments.facultyId,
				})
				.from(schema.departments)
				.groupBy(schema.departments.facultyId),
		]);
		const countByFaculty = new Map(
			departmentCounts.map((row) => [row.facultyId, Number(row.count)]),
		);

		return faculties.map((faculty) => ({
			...faculty,
			departmentCount: countByFaculty.get(faculty.id) ?? 0,
		}));
	}

	async updateDepartment(input: {
		actorId: EntityId;
		code: string | null;
		description: string | null;
		facultyId: EntityId;
		id?: EntityId;
		name: string;
		slug: string;
	}): Promise<ManagedDepartment> {
		return this.database.transaction(async (transaction) => {
			if (!input.id) throw new Error("Department ID is required.");

			const [department] = await transaction
				.update(schema.departments)
				.set({
					code: input.code,
					description: input.description,
					facultyId: input.facultyId,
					name: input.name,
					slug: input.slug,
					updatedAt: new Date(),
				})
				.where(eq(schema.departments.id, input.id))
				.returning({
					code: schema.departments.code,
					createdAt: schema.departments.createdAt,
					description: schema.departments.description,
					facultyId: schema.departments.facultyId,
					id: schema.departments.id,
					name: schema.departments.name,
					slug: schema.departments.slug,
					updatedAt: schema.departments.updatedAt,
				});
			if (!department) throw new Error("Department could not be updated.");

			await transaction.insert(schema.auditLogs).values({
				action: "organization.department.updated",
				actorId: input.actorId,
				metadata: {
					code: input.code,
					facultyId: input.facultyId,
					name: input.name,
				},
				targetId: department.id,
				targetType: "department",
			});

			return {
				...department,
				facultyName: await this.readFacultyName(
					transaction,
					department.facultyId,
				),
			};
		});
	}

	async updateFaculty(input: {
		actorId: EntityId;
		code: string | null;
		description: string | null;
		id?: EntityId;
		name: string;
		slug: string;
	}): Promise<ManagedFaculty> {
		return this.database.transaction(async (transaction) => {
			if (!input.id) throw new Error("Faculty ID is required.");

			const [faculty] = await transaction
				.update(schema.faculties)
				.set({
					code: input.code,
					description: input.description,
					name: input.name,
					slug: input.slug,
					updatedAt: new Date(),
				})
				.where(eq(schema.faculties.id, input.id))
				.returning(facultySelection);
			if (!faculty) throw new Error("Faculty could not be updated.");

			await transaction.insert(schema.auditLogs).values({
				action: "organization.faculty.updated",
				actorId: input.actorId,
				metadata: { code: input.code, name: input.name },
				targetId: faculty.id,
				targetType: "faculty",
			});

			return {
				...faculty,
				departmentCount: await this.departmentCountForFaculty(faculty.id),
			};
		});
	}

	private async departmentCountForFaculty(facultyId: EntityId) {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.departments)
			.where(eq(schema.departments.facultyId, facultyId));

		return Number(row?.count ?? 0);
	}

	private async readFacultyName(
		database: Pick<Database, "select">,
		facultyId: EntityId,
	) {
		const [faculty] = await database
			.select({ name: schema.faculties.name })
			.from(schema.faculties)
			.where(eq(schema.faculties.id, facultyId))
			.limit(1);

		return faculty?.name ?? "Unknown faculty";
	}
}

function departmentWhere(filters: OrganizationListFilters): SQL | undefined {
	const conditions: SQL[] = [];
	const search = filters.search?.trim();

	if (filters.facultyId) {
		conditions.push(eq(schema.departments.facultyId, filters.facultyId));
	}

	if (search) {
		conditions.push(
			or(
				ilike(schema.departments.name, `%${search}%`),
				ilike(schema.departments.code, `%${search}%`),
				ilike(schema.faculties.name, `%${search}%`),
				ilike(schema.faculties.code, `%${search}%`),
			) as SQL,
		);
	}

	return conditions.length ? and(...conditions) : undefined;
}

function facultyWhere(filters: OrganizationListFilters): SQL | undefined {
	const conditions: SQL[] = [];
	const search = filters.search?.trim();

	if (filters.facultyId) {
		conditions.push(eq(schema.faculties.id, filters.facultyId));
	}

	if (search) {
		conditions.push(
			or(
				ilike(schema.faculties.name, `%${search}%`),
				ilike(schema.faculties.code, `%${search}%`),
			) as SQL,
		);
	}

	return conditions.length ? and(...conditions) : undefined;
}
