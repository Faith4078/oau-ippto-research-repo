import { describe, expect, it } from "vitest";

import {
	buildResearchReviewDecision,
	dashboardDestinationForRoles,
	dashboardDestinationsForRoles,
	loadResearchReviewQueue,
	researchReviewAccessForUser,
} from "#/application/dashboard-workspaces.ts";

describe("role dashboard destinations", () => {
	it.each([
		[["super_administrator"], "/dashboard/super-admin"],
		[["faculty_administrator"], "/dashboard/faculty-admin"],
		[["department_administrator"], "/dashboard/department-admin"],
		[["iptto_officer"], "/dashboard/iptto-officer"],
		[["lecturer"], "/dashboard/lecturer"],
	])("sends %s to its own workspace", (roles, expected) => {
		expect(dashboardDestinationForRoles(roles)).toBe(expected);
	});
});

describe("role dashboard switching", () => {
	it("lists every dashboard available to a multi-role user", () => {
		expect(
			dashboardDestinationsForRoles([
				"lecturer",
				"department_administrator",
			]),
		).toEqual(["/dashboard/lecturer", "/dashboard/department-admin"]);
	});

	it("lists elevated dashboards for super administrators", () => {
		expect(dashboardDestinationsForRoles(["super_administrator"])).toEqual([
			"/dashboard/department-admin",
			"/dashboard/faculty-admin",
			"/dashboard/iptto-officer",
			"/dashboard/super-admin",
		]);
	});

	it("keeps the existing default dashboard priority", () => {
		expect(
			dashboardDestinationForRoles([
				"lecturer",
				"super_administrator",
			]),
		).toBe("/dashboard/super-admin");
	});
});

describe("review queue access", () => {
	it("scopes department reviewers to their own department", () => {
		expect(
			researchReviewAccessForUser({
				departmentId: "department-1",
				facultyId: "faculty-1",
				roles: ["department_administrator"],
				stage: "department",
			}),
		).toEqual({
			departmentId: "department-1",
			facultyId: null,
			status: "department_review",
		});
	});

	it.each([
		[
			"iptto",
			["iptto_officer"],
			{ departmentId: null, facultyId: null, status: "iptto_review" },
		],
		[
			"department",
			["super_administrator"],
			{ departmentId: null, facultyId: null, status: "department_review" },
		],
	] as const)("returns the correct %s queue scope", (stage, roles, expected) => {
		expect(
			researchReviewAccessForUser({
				departmentId: "department-1",
				facultyId: "faculty-1",
				roles,
				stage,
			}),
		).toEqual(expected);
	});

	it("does not expose a review queue to faculty administrators", () => {
		expect(
			researchReviewAccessForUser({
				departmentId: "department-1",
				facultyId: "faculty-1",
				roles: ["faculty_administrator"],
				stage: "department",
			}),
		).toBeNull();
	});

	it("loads only the queue selected by the authenticated reviewer scope", async () => {
		const accesses: unknown[] = [];
		const result = await loadResearchReviewQueue(
			{
				departmentId: "department-1",
				facultyId: "faculty-1",
				roles: ["department_administrator"],
			},
			"department",
			{
				async listResearchReviewQueue(access) {
					accesses.push(access);
					return [
						{
							abstract: "A review-ready research summary.",
							createdAt: new Date("2026-08-25T00:00:00.000Z"),
							department: "Computer Science",
							faculty: "Technology",
							id: "research-1",
							owner: "Dr Researcher",
							requiresIpttoReview: false,
							status: "department_review" as const,
							title: "Scoped research",
						},
					];
				},
			},
		);

		expect(result.ok && result.value[0]?.title).toBe("Scoped research");
		expect(accesses).toEqual([
			{
				departmentId: "department-1",
				facultyId: null,
				status: "department_review",
			},
		]);
	});
});

describe("dashboard research decisions", () => {
	it("lets a department reviewer begin a newly submitted review", () => {
		expect(
			buildResearchReviewDecision({
				comment: null,
				currentStatus: "submitted",
				decision: "approve",
				requiresIpttoReview: false,
				researchRecordId: "00000000-0000-4000-8000-000000000001",
				stage: "department",
			}),
		).toMatchObject({
			fromStatus: "submitted",
			toStatus: "department_review",
		});
	});

	it("moves a department approval to approved", () => {
		expect(
			buildResearchReviewDecision({
				comment: null,
				decision: "approve",
				requiresIpttoReview: false,
				researchRecordId: "00000000-0000-4000-8000-000000000001",
				stage: "department",
			}),
		).toEqual({
			comment: null,
			decision: "approve",
			fromStatus: "department_review",
			requiresIpttoReview: false,
			researchRecordId: "00000000-0000-4000-8000-000000000001",
			toStatus: "approved",
		});
	});

	it.each([
		["department", "approve", false, "department_review", "approved"],
		["department", "approve", true, "department_review", "iptto_review"],
		["department", "request_changes", false, "department_review", "draft"],
		["department", "reject", false, "department_review", "rejected"],
		["iptto", "approve", true, "iptto_review", "approved"],
		["iptto", "request_changes", true, "iptto_review", "draft"],
		["iptto", "reject", true, "iptto_review", "rejected"],
	] as const)(
		"maps %s %s to the correct workflow step",
		(stage, decision, requiresIpttoReview, fromStatus, toStatus) => {
			expect(
				buildResearchReviewDecision({
					comment: decision === "approve" ? null : "Review explanation",
					decision,
					requiresIpttoReview,
					researchRecordId: "00000000-0000-4000-8000-000000000001",
					stage,
				}),
			).toMatchObject({ fromStatus, toStatus });
		},
	);
});
