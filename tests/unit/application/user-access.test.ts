import { describe, expect, it } from "vitest";

import { createUserAccessService } from "#/application/user-access.ts";
import type { AuthenticatedActor } from "#/application/authorization.ts";

const administrator: AuthenticatedActor = {
	roles: [{ role: "super_administrator" }],
	status: "active",
	userId: "00000000-0000-4000-8000-000000000001",
};

const facultyId = "00000000-0000-4000-8000-000000000010";
const departmentId = "00000000-0000-4000-8000-000000000020";
const targetUserId = "00000000-0000-4000-8000-000000000002";

const facultyAdministrator: AuthenticatedActor = {
	roles: [{ role: "faculty_administrator", facultyId }],
	status: "active",
	userId: "00000000-0000-4000-8000-000000000003",
};

const activeLecturer = {
	departmentId,
	email: "lecturer@example.edu",
	facultyId,
	id: targetUserId,
	name: "Dr Lecturer",
	roleAssignments: [
		{
			assignedAt: new Date("2025-01-01T00:00:00.000Z"),
			departmentId,
			facultyId,
			role: "lecturer",
		},
	],
	roles: ["lecturer"],
	staffId: "AC/1234",
	status: "active",
} as const;

describe("user access administration", () => {
	it("promotes an active lecturer to faculty administrator", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return true;
			},
			async findUserRoles() {
				return ["lecturer"];
			},
			async listUsers() {
				return [activeLecturer];
			},
			async setUserAccess(input) {
				changes.push(input);
			},
		});

		const result = await service.setAccess(administrator, {
			departmentId: null,
			facultyId,
			role: "faculty_administrator",
			userId: targetUserId,
		});

		expect(result.ok).toBe(true);
		expect(changes).toEqual([
			expect.objectContaining({
				facultyId,
				role: "faculty_administrator",
				userId: targetUserId,
			}),
		]);
	});

	it("lets faculty administrators assign department administrators in their faculty", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return true;
			},
			async findUserRoles() {
				return ["lecturer"];
			},
			async listUsers() {
				return [activeLecturer];
			},
			async setUserAccess(input) {
				changes.push(input);
			},
		});

		const result = await service.setAccess(facultyAdministrator, {
			departmentId,
			facultyId,
			role: "department_administrator",
			userId: targetUserId,
		});

		expect(result.ok).toBe(true);
		expect(changes).toEqual([
			expect.objectContaining({
				departmentId,
				facultyId,
				role: "department_administrator",
				userId: targetUserId,
			}),
		]);
	});

	it("rejects a department outside the selected faculty", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return false;
			},
			async findUserRoles() {
				return [];
			},
			async listUsers() {
				return [activeLecturer];
			},
			async setUserAccess(input) {
				changes.push(input);
			},
		});

		const result = await service.setAccess(facultyAdministrator, {
			departmentId,
			facultyId,
			role: "department_administrator",
			userId: targetUserId,
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
			async findUserRoles() {
				return [];
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
				userId: targetUserId,
			},
		);

		expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
	});

	it("lets super administrators assign department administrators", async () => {
		const changes: unknown[] = [];
		const repository = {
			async departmentBelongsToFaculty() {
				return true;
			},
			async findUserRoles() {
				return ["lecturer"] as const;
			},
			async listUsers() {
				return [activeLecturer];
			},
			async setUserAccess(input: unknown) {
				changes.push(input);
			},
		};
		const service = createUserAccessService(repository);

		const result = await service.setAccess(administrator, {
			departmentId,
			facultyId,
			role: "department_administrator",
			userId: targetUserId,
		});

		expect(result.ok).toBe(true);
		expect(changes).toEqual([
			expect.objectContaining({
				departmentId,
				facultyId,
				role: "department_administrator",
				userId: targetUserId,
			}),
		]);
	});

	it("blocks faculty administrators from assigning outside their faculty", async () => {
		const changes: unknown[] = [];
		const service = createUserAccessService({
			async departmentBelongsToFaculty() {
				return true;
			},
			async findUserRoles() {
				return ["lecturer"];
			},
			async listUsers() {
				return [activeLecturer];
			},
			async setUserAccess(input: unknown) {
				changes.push(input);
			},
		});

		const result = await service.setAccess(facultyAdministrator, {
			departmentId,
			facultyId: "00000000-0000-4000-8000-000000000099",
			role: "department_administrator",
			userId: targetUserId,
		});

		expect(result).toMatchObject({
			ok: false,
			error: { code: "FACULTY_SCOPE_FORBIDDEN" },
		});
		expect(changes).toHaveLength(0);
	});
});
