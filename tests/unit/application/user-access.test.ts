import { describe, expect, it } from "vitest";

import { createUserAccessService } from "#/application/user-access.ts";
import type { AuthenticatedActor } from "#/application/authorization.ts";

const administrator: AuthenticatedActor = {
	roles: [{ role: "super_administrator" }],
	status: "active",
	userId: "00000000-0000-4000-8000-000000000001",
};

describe("user access administration", () => {
	it("assigns a faculty administrator only with a faculty scope", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return true;
			},
			async listUsers() { return []; },
			async setUserAccess(input) { changes.push(input); },
		});

		const result = await service.setAccess(administrator, {
			departmentId: null,
			facultyId: "00000000-0000-4000-8000-000000000010",
			role: "faculty_administrator",
			userId: "00000000-0000-4000-8000-000000000002",
		});

		expect(result.ok).toBe(true);
		expect(changes).toHaveLength(1);
	});

	it("rejects a department outside the selected faculty", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return false;
			},
			async listUsers() {
				return [];
			},
			async setUserAccess(input) {
				changes.push(input);
			},
		});

		const result = await service.setAccess(administrator, {
			departmentId: "00000000-0000-4000-8000-000000000020",
			facultyId: "00000000-0000-4000-8000-000000000010",
			role: "department_administrator",
			userId: "00000000-0000-4000-8000-000000000002",
		});

		expect(result).toMatchObject({
			ok: false,
			error: { code: "DEPARTMENT_FACULTY_MISMATCH" },
		});
		expect(changes).toHaveLength(0);
	});

	it("denies access changes without the Super Administrator permission", async () => {
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return true;
			},
			async listUsers() {
				return [];
			},
			async setUserAccess() {},
		});

		const result = await service.setAccess(
			{
				roles: [{ role: "lecturer" }],
				status: "active",
				userId: "00000000-0000-4000-8000-000000000003",
			},
			{
				departmentId: null,
				facultyId: null,
				role: "iptto_officer",
				userId: "00000000-0000-4000-8000-000000000002",
			},
		);

		expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
	});
});
