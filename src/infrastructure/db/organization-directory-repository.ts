import { asc } from "drizzle-orm";

import type { OrganizationDirectoryRepository } from "#/application/organization-directory.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class PostgresOrganizationDirectoryRepository
	implements OrganizationDirectoryRepository
{
	constructor(private readonly database: Database) {}
	listFaculties() {
		return this.database
			.select({ id: schema.faculties.id, name: schema.faculties.name })
			.from(schema.faculties)
			.orderBy(asc(schema.faculties.name));
	}
	listDepartments() {
		return this.database
			.select({
				id: schema.departments.id,
				facultyId: schema.departments.facultyId,
				name: schema.departments.name,
			})
			.from(schema.departments)
			.orderBy(asc(schema.departments.name));
	}
}
