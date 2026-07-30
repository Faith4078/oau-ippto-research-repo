import { describe, expect, it } from "vitest";
import {
	canAccessResearchRecord,
	hasPermission,
	type AuthenticatedActor,
} from "../../../src/application/authorization.ts";
import { permissions } from "../../../src/domain/permissions.ts";

const departmentAdmin: AuthenticatedActor = {
	userId: "user-1",
	status: "active",
	roles: [
		{
			role: "department_administrator",
			facultyId: "faculty-1",
			departmentId: "department-1",
		},
	],
};

const scopedLecturer: AuthenticatedActor = {
	userId: "user-2",
	status: "active",
	roles: [
		{
			role: "lecturer",
			facultyId: "faculty-1",
			departmentId: "department-1",
		},
	],
};

describe("authorization guards", () => {
	it("allows scoped roles to perform unscoped actions they are permitted to use", () => {
		expect(hasPermission(scopedLecturer, permissions.submitResearch)).toBe(true);
	});

	it("allows scoped department administrators inside their department", () => {
		expect(
			hasPermission(departmentAdmin, permissions.reviewDepartmentResearch, {
				facultyId: "faculty-1",
				departmentId: "department-1",
			}),
		).toBe(true);
	});

	it("rejects scoped department administrators outside their department", () => {
		expect(
			hasPermission(departmentAdmin, permissions.reviewDepartmentResearch, {
				facultyId: "faculty-1",
				departmentId: "department-2",
			}),
		).toBe(false);
	});

	it("allows public research without an authenticated actor", () => {
		expect(
			canAccessResearchRecord(null, {
				accessLevel: "public",
				facultyId: "faculty-1",
				departmentId: "department-1",
				ownerId: null,
			}),
		).toBe(true);
	});

	it("rejects private research for users without private access", () => {
		expect(
			canAccessResearchRecord(departmentAdmin, {
				accessLevel: "private",
				facultyId: "faculty-1",
				departmentId: "department-1",
				ownerId: null,
			}),
		).toBe(false);
	});
});
