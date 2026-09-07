import { describe, expect, it } from "vitest";

import { createInitialResearchSubmissionState } from "#/application/research-submission-state.ts";

describe("new research workflow state", () => {
	it("routes restricted research directly to IPTTO review without publishing it", () => {
		expect(createInitialResearchSubmissionState(true, "restricted")).toEqual({
			metadata: { requiresIpttoReview: true },
			publishedAt: null,
			status: "iptto_review",
		});
	});

	it("routes private research to IPTTO review too", () => {
		expect(createInitialResearchSubmissionState(false, "private")).toEqual({
			metadata: { requiresIpttoReview: false },
			publishedAt: null,
			status: "iptto_review",
		});
	});

	it("publishes public research immediately instead of queueing it for review", () => {
		const result = createInitialResearchSubmissionState(false, "public");

		expect(result.status).toBe("published");
		expect(result.metadata).toEqual({ requiresIpttoReview: false });
		expect(result.publishedAt).toBeInstanceOf(Date);
	});
});
