import type { EntityId } from "#/domain/common.ts";

import { ok } from "./result.ts";

export type OrganizationOption = { id: EntityId; name: string };
export type DepartmentOption = OrganizationOption & { facultyId: EntityId };

export type OrganizationDirectoryRepository = {
	listFaculties(): Promise<readonly OrganizationOption[]>;
	listDepartments(): Promise<readonly DepartmentOption[]>;
};

export function createOrganizationDirectoryService(
	repository: OrganizationDirectoryRepository,
) {
	return {
		async listOptions() {
			const [faculties, departments] = await Promise.all([
				repository.listFaculties(),
				repository.listDepartments(),
			]);
			return ok({ faculties, departments });
		},
	};
}

export type OrganizationDirectoryService = ReturnType<
	typeof createOrganizationDirectoryService
>;
