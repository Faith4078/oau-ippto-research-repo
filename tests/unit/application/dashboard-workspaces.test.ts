import { describe, expect, it } from "vitest";

import {
	buildResearchReviewDecision,
	dashboardDestinationForRoles,
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
			"faculty",
			["faculty_administrator"],
			{ departmentId: null, facultyId: "faculty-1", status: "faculty_review" },
		],
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

	it("does not expose a review queue to the wrong role", () => {
		expect(
			researchReviewAccessForUser({
				departmentId: "department-1",
				facultyId: "faculty-1",
				roles: ["lecturer"],
				stage: "faculty",
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

	it("moves a department approval to faculty review", () => {
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
			toStatus: "faculty_review",
		});
	});

	it.each([
		["department", "request_changes", false, "department_review", "draft"],
		["department", "reject", false, "department_review", "rejected"],
		["faculty", "approve", false, "faculty_review", "approved"],
		["faculty", "approve", true, "faculty_review", "iptto_review"],
		[
			"faculty",
			"request_changes",
			false,
			"faculty_review",
			"department_review",
		],
		["faculty", "reject", false, "faculty_review", "rejected"],
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
