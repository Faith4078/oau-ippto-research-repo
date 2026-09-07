import type { AccessLevel } from "#/domain/common.ts";

export function createInitialResearchSubmissionState(
	requiresIpttoReview: boolean,
	accessLevel: AccessLevel,
) {
	if (accessLevel === "public") {
		return {
			metadata: { requiresIpttoReview },
			publishedAt: new Date(),
			status: "published" as const,
		};
	}

	return {
		metadata: { requiresIpttoReview },
		publishedAt: null,
		status: "iptto_review" as const,
	};
}
