import { describe, expect, it } from "vitest";
import {
	getAllowedResearchTransitions,
	resolveResearchTransition,
} from "../../../src/domain/approval-workflow.ts";

describe("research approval workflow", () => {
	it("requires IPTTO review when faculty approval marks the record as IPTTO-bound", () => {
		const result = resolveResearchTransition({
			from: "faculty_review",
			to: "approved",
			decision: "approve",
			requiresIpttoReview: true,
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("INVALID_APPROVAL_TRANSITION");
	});

	it("allows faculty approval to move IPTTO-bound records to IPTTO review", () => {
		const result = resolveResearchTransition({
			from: "faculty_review",
			to: "iptto_review",
			decision: "approve",
			requiresIpttoReview: true,
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.to : null).toBe("iptto_review");
	});

	it("requires a comment for rejections", () => {
		const result = resolveResearchTransition({
			from: "department_review",
			to: "rejected",
			decision: "reject",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("APPROVAL_COMMENT_REQUIRED");
	});

	it("allows IPTTO to return research directly to the lecturer", () => {
		const result = resolveResearchTransition({
			from: "iptto_review",
			to: "draft",
			decision: "request_changes",
			comment: "Please address the review comments.",
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.to : null).toBe("draft");
	});

	it("lists only applicable faculty transitions for IPTTO-bound records", () => {
		const transitions = getAllowedResearchTransitions("faculty_review", true);

		expect(transitions.map((transition) => transition.to)).toContain("iptto_review");
		expect(transitions.map((transition) => transition.to)).not.toContain("approved");
	});
});
