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

export function dashboardDestinationForRoles(
	roles: readonly string[],
): DashboardDestination {
	return (
		roleDestinations.find(({ role }) => roles.includes(role))?.destination ??
		"/dashboard/lecturer"
	);
}

export type ResearchReviewStage = "department" | "faculty" | "iptto";
export type ResearchReviewDecision = "approve" | "request_changes" | "reject";
export type ResearchReviewStatus =
	| "department_review"
	| "faculty_review"
	| "iptto_review";

export type ResearchReviewAccess = {
	departmentId: string | null;
	facultyId: string | null;
	status: ResearchReviewStatus;
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
	roles: readonly RoleKey[];
	stage: ResearchReviewStage;
}) {
	if (input.roles.includes("super_administrator")) {
		const statusByStage = {
			department: "department_review",
			faculty: "faculty_review",
			iptto: "iptto_review",
		} as const;
		return {
			departmentId: null,
			facultyId: null,
			status: statusByStage[input.stage],
		};
	}

	if (
		input.stage === "department" &&
		input.roles.includes("department_administrator") &&
		input.departmentId
	) {
		return {
			departmentId: input.departmentId,
			facultyId: null,
			status: "department_review" as const,
		};
	}

	if (
		input.stage === "faculty" &&
		input.roles.includes("faculty_administrator") &&
		input.facultyId
	) {
		return {
			departmentId: null,
			facultyId: input.facultyId,
			status: "faculty_review" as const,
		};
	}

	if (input.stage === "iptto" && input.roles.includes("iptto_officer")) {
		return {
			departmentId: null,
			facultyId: null,
			status: "iptto_review" as const,
		};
	}

	return null;
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
		faculty: "faculty_review",
		iptto: "iptto_review",
	} as const;
	const fromStatus = input.currentStatus ?? stageStatus[input.stage];
	const changeTarget = {
		department: "draft",
		faculty: "department_review",
		iptto: "faculty_review",
	} as const;
	const approvalTarget = {
		department: "faculty_review",
		faculty: input.requiresIpttoReview ? "iptto_review" : "approved",
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
