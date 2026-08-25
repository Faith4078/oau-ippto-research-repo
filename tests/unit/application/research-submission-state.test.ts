import { describe, expect, it } from "vitest";

import { createInitialResearchSubmissionState } from "#/application/research-submission-state.ts";

describe("new research workflow state", () => {
	it("starts in the review workflow and is not public yet", () => {
		expect(createInitialResearchSubmissionState(true)).toEqual({
			metadata: { requiresIpttoReview: true },
			publishedAt: null,
			status: "submitted",
		});
	});
});
