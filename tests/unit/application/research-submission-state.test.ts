import { describe, expect, it } from "vitest";

import { createInitialResearchSubmissionState } from "#/application/research-submission-state.ts";

describe("new research workflow state", () => {
	it("routes new research directly to IPTTO review without publishing it", () => {
		expect(createInitialResearchSubmissionState(true)).toEqual({
			metadata: { requiresIpttoReview: true },
			publishedAt: null,
			status: "iptto_review",
		});
	});

	it("uses IPTTO as the temporary reviewer for ordinary research too", () => {
		expect(createInitialResearchSubmissionState(false)).toEqual({
			metadata: { requiresIpttoReview: false },
			publishedAt: null,
			status: "iptto_review",
		});
	});
});
