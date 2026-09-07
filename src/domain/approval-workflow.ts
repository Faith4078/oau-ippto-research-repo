import type {
	ApprovalAction,
	ApprovalDecision,
	RecordStatus,
} from "./common.ts";

export type ApprovalTransition = {
	from: RecordStatus;
	to: RecordStatus;
	decision: ApprovalDecision;
	action: ApprovalAction;
	requiresComment: boolean;
};

export type ApprovalTransitionRequest = {
	from: RecordStatus;
	to: RecordStatus;
	decision: ApprovalDecision;
	comment?: string | null;
	requiresIpttoReview?: boolean;
};

export type ApprovalTransitionResult =
	| { ok: true; value: ApprovalTransition }
	| { ok: false; error: { code: string; message: string } };

const baseTransitions = [
	transition("draft", "submitted", "submit", "submitted"),
	transition("submitted", "department_review", "approve", "approved"),
	transition("submitted", "rejected", "reject", "rejected", true),
	transition("department_review", "faculty_review", "approve", "approved"),
	transition("department_review", "rejected", "reject", "rejected", true),
	transition(
		"department_review",
		"draft",
		"request_changes",
		"changes_requested",
		true,
	),
	transition("faculty_review", "approved", "approve", "approved"),
	transition("faculty_review", "iptto_review", "approve", "approved"),
	transition("faculty_review", "rejected", "reject", "rejected", true),
	transition(
		"faculty_review",
		"department_review",
		"request_changes",
		"changes_requested",
		true,
	),
	transition("iptto_review", "approved", "approve", "approved"),
	transition("iptto_review", "rejected", "reject", "rejected", true),
	transition(
		"iptto_review",
		"draft",
		"request_changes",
		"changes_requested",
		true,
	),
	transition("approved", "published", "publish", "published"),
	transition("approved", "archived", "archive", "archived"),
	transition("published", "archived", "archive", "archived"),
	transition("rejected", "draft", "request_changes", "changes_requested", true),
] as const;

export const approvalTransitions: readonly ApprovalTransition[] =
	baseTransitions;

function transition(
	from: RecordStatus,
	to: RecordStatus,
	decision: ApprovalDecision,
	action: ApprovalAction,
	requiresComment = false,
): ApprovalTransition {
	return { from, to, decision, action, requiresComment };
}

export function getAllowedResearchTransitions(
	status: RecordStatus,
	requiresIpttoReview = false,
): ApprovalTransition[] {
	return approvalTransitions.filter(
		(candidate) =>
			isTransitionAllowedForIpttoRequirement(candidate, requiresIpttoReview) &&
			candidate.from === status,
	);
}

export function resolveResearchTransition({
	from,
	to,
	decision,
	comment,
	requiresIpttoReview = false,
}: ApprovalTransitionRequest): ApprovalTransitionResult {
	const candidate = approvalTransitions.find(
		(item) =>
			item.from === from && item.to === to && item.decision === decision,
	);

	if (
		!candidate ||
		!isTransitionAllowedForIpttoRequirement(candidate, requiresIpttoReview)
	) {
		return {
			ok: false,
			error: {
				code: "INVALID_APPROVAL_TRANSITION",
				message: `Cannot ${decision} research from ${from} to ${to}.`,
			},
		};
	}

	if (candidate.requiresComment && !comment?.trim()) {
		return {
			ok: false,
			error: {
				code: "APPROVAL_COMMENT_REQUIRED",
				message: `A comment is required to ${decision} this research record.`,
			},
		};
	}

	return { ok: true, value: candidate };
}

function isTransitionAllowedForIpttoRequirement(
	transition: ApprovalTransition,
	requiresIpttoReview: boolean,
) {
	if (
		transition.from === "faculty_review" &&
		transition.decision === "approve" &&
		transition.to === "approved"
	) {
		return !requiresIpttoReview;
	}

	if (
		transition.from === "faculty_review" &&
		transition.decision === "approve" &&
		transition.to === "iptto_review"
	) {
		return requiresIpttoReview;
	}

	return true;
}
