import type { RoleKey } from "#/domain/organization.ts";

import { fail, ok, type Result } from "./result.ts";

export type DashboardDestination =
	| "/dashboard/lecturer"
	| "/dashboard/department-admin"
	| "/dashboard/faculty-admin"
	| "/dashboard/iptto-officer"
	| "/dashboard/super-admin";

const roleDestinations: ReadonlyArray<{
	role: RoleKey;
	destination: DashboardDestination;
}> = [
	{ role: "super_administrator", destination: "/dashboard/super-admin" },
	{ role: "faculty_administrator", destination: "/dashboard/faculty-admin" },
	{
		role: "department_administrator",
		destination: "/dashboard/department-admin",
	},
	{ role: "iptto_officer", destination: "/dashboard/iptto-officer" },
	{ role: "lecturer", destination: "/dashboard/lecturer" },
];

const destinationAccess: ReadonlyArray<{
	destination: DashboardDestination;
	roles: readonly RoleKey[];
}> = [
	{ destination: "/dashboard/lecturer", roles: ["lecturer"] },
	{
		destination: "/dashboard/department-admin",
		roles: ["department_administrator", "super_administrator"],
	},
	{
		destination: "/dashboard/faculty-admin",
		roles: ["faculty_administrator", "super_administrator"],
	},
	{
		destination: "/dashboard/iptto-officer",
		roles: ["iptto_officer", "super_administrator"],
	},
	{ destination: "/dashboard/super-admin", roles: ["super_administrator"] },
];

export function dashboardDestinationForRoles(
	roles: readonly string[],
): DashboardDestination {
	return (
		roleDestinations.find(({ role }) => roles.includes(role))?.destination ??
		"/dashboard/lecturer"
	);
}

export function dashboardDestinationsForRoles(
	roles: readonly string[],
): readonly DashboardDestination[] {
	return destinationAccess
		.filter((access) => access.roles.some((role) => roles.includes(role)))
		.map((access) => access.destination);
}

export type ResearchReviewStage = "department" | "iptto";
export type ResearchReviewDecision = "approve" | "request_changes" | "reject";
export type ResearchReviewStatus = "department_review" | "iptto_review";

export type ResearchReviewAccess = {
	departmentId: string | null;
	facultyId: string | null;
	status: ResearchReviewStatus;
};

export type DashboardRoleAssignment = {
	role: RoleKey;
	departmentId?: string | null;
	facultyId?: string | null;
};

export type ResearchReviewQueueItem = {
	abstract: string;
	createdAt: Date;
	department: string;
	faculty: string;
	id: string;
	owner: string;
	requiresIpttoReview: boolean;
	status: ResearchReviewStatus | "submitted";
	title: string;
};

export type DashboardWorkspaceRepository = {
	listResearchReviewQueue(
		access: ResearchReviewAccess,
	): Promise<readonly ResearchReviewQueueItem[]>;
};

export async function loadResearchReviewQueue(
	user: {
		departmentId: string | null;
		facultyId: string | null;
		roleAssignments?: readonly DashboardRoleAssignment[];
		roles: readonly RoleKey[];
	},
	stage: ResearchReviewStage,
	repository: DashboardWorkspaceRepository,
): Promise<Result<readonly ResearchReviewQueueItem[]>> {
	const access = researchReviewAccessForUser({ ...user, stage });

	if (!access) {
		return fail(
			"DASHBOARD_REVIEW_FORBIDDEN",
			"You do not have access to this review queue.",
		);
	}

	return ok(await repository.listResearchReviewQueue(access));
}

export function researchReviewAccessForUser(input: {
	departmentId: string | null;
	facultyId: string | null;
	roleAssignments?: readonly DashboardRoleAssignment[];
	roles: readonly RoleKey[];
	stage: ResearchReviewStage;
}) {
	const roleAssignments = dashboardRoleAssignmentsForUser(input);

	if (
		roleAssignments.some(
			(assignment) => assignment.role === "super_administrator",
		)
	) {
		const statusByStage = {
			department: "department_review",
			iptto: "iptto_review",
		} as const;
		return {
			departmentId: null,
			facultyId: null,
			status: statusByStage[input.stage],
		};
	}
	const departmentAssignment = roleAssignments.find(
		(assignment) =>
			assignment.role === "department_administrator" &&
			Boolean(assignment.departmentId),
	);

	if (input.stage === "department" && departmentAssignment?.departmentId) {
		return {
			departmentId: departmentAssignment.departmentId,
			facultyId: null,
			status: "department_review" as const,
		};
	}
	if (
		input.stage === "iptto" &&
		roleAssignments.some((assignment) => assignment.role === "iptto_officer")
	) {
		return {
			departmentId: null,
			facultyId: null,
			status: "iptto_review" as const,
		};
	}

	return null;
}

export function dashboardRoleAssignmentsForUser(input: {
	departmentId: string | null;
	facultyId: string | null;
	roleAssignments?: readonly DashboardRoleAssignment[];
	roles: readonly RoleKey[];
}): readonly DashboardRoleAssignment[] {
	return input.roleAssignments?.length
		? input.roleAssignments
		: input.roles.map((role) => ({
				role,
				departmentId: input.departmentId,
				facultyId: input.facultyId,
			}));
}

export function buildResearchReviewDecision(input: {
	comment: string | null;
	currentStatus?: ResearchReviewStatus | "submitted";
	decision: ResearchReviewDecision;
	requiresIpttoReview: boolean;
	researchRecordId: string;
	stage: ResearchReviewStage;
}) {
	const stageStatus = {
		department: "department_review",
		iptto: "iptto_review",
	} as const;
	const fromStatus = input.currentStatus ?? stageStatus[input.stage];
	const changeTarget = {
		department: "draft",
		iptto: "draft",
	} as const;
	const approvalTarget = {
		department: input.requiresIpttoReview ? "iptto_review" : "approved",
		iptto: "approved",
	} as const;
	const toStatus =
		fromStatus === "submitted" && input.decision === "approve"
			? "department_review"
			: input.decision === "approve"
				? approvalTarget[input.stage]
				: input.decision === "request_changes"
					? changeTarget[input.stage]
					: "rejected";

	return {
		comment: input.comment,
		decision: input.decision,
		fromStatus,
		requiresIpttoReview: input.requiresIpttoReview,
		researchRecordId: input.researchRecordId,
		toStatus,
	};
}
