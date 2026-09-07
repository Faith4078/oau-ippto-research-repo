export function createInitialResearchSubmissionState(
	requiresIpttoReview: boolean,
) {
	return {
		metadata: { requiresIpttoReview },
		publishedAt: null,
		status: "iptto_review" as const,
	};
}
