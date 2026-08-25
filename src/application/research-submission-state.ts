export function createInitialResearchSubmissionState(
	requiresIpttoReview: boolean,
) {
	return {
		metadata: { requiresIpttoReview },
		publishedAt: null,
		status: "submitted" as const,
	};
}
