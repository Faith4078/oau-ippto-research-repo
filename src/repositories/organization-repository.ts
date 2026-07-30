import type { Department, EntityId, Faculty, User } from "../domain/index.ts";

export type OrganizationRepository = {
	findFacultyById(id: EntityId): Promise<Faculty | null>;
	findDepartmentById(id: EntityId): Promise<Department | null>;
	listDepartmentsByFaculty(facultyId: EntityId): Promise<Department[]>;
	findUserById(id: EntityId): Promise<User | null>;
	findUserByStaffId(staffId: string): Promise<User | null>;
};
