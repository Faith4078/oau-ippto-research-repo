import { fail, ok, type Result } from "./result.ts";

export const rateLimitBuckets = {
	auth: "auth",
	signedUploadUrl: "signed_upload_url",
	signedDownloadUrl: "signed_download_url",
	search: "search",
} as const;

export type RateLimitBucket =
	(typeof rateLimitBuckets)[keyof typeof rateLimitBuckets];

export type RateLimitPolicy = {
	bucket: RateLimitBucket;
	limit: number;
	windowMs: number;
};

export type RateLimitRequest = {
	bucket: RateLimitBucket;
	identity: string;
	now?: Date;
};

export type RateLimitDecision =
	| {
			allowed: true;
			limit: number;
			remaining: number;
			resetAt: Date;
	  }
	| {
			allowed: false;
			limit: number;
			remaining: 0;
			resetAt: Date;
			retryAfterSeconds: number;
	  };

export type RateLimitStore = {
	consume(input: {
		policy: RateLimitPolicy;
		identity: string;
		now: Date;
	}): Promise<RateLimitDecision>;
};

export const defaultRateLimitPolicies = {
	[rateLimitBuckets.auth]: {
		bucket: rateLimitBuckets.auth,
		limit: 10,
		windowMs: 60_000,
	},
	[rateLimitBuckets.signedUploadUrl]: {
		bucket: rateLimitBuckets.signedUploadUrl,
		limit: 30,
		windowMs: 60_000,
	},
	[rateLimitBuckets.signedDownloadUrl]: {
		bucket: rateLimitBuckets.signedDownloadUrl,
		limit: 60,
		windowMs: 60_000,
	},
	[rateLimitBuckets.search]: {
		bucket: rateLimitBuckets.search,
		limit: 120,
		windowMs: 60_000,
	},
} as const satisfies Record<RateLimitBucket, RateLimitPolicy>;

export type RateLimiterService = ReturnType<typeof createRateLimiterService>;

export function createRateLimiterService(dependencies: {
	store: RateLimitStore;
	policies?: Partial<Record<RateLimitBucket, RateLimitPolicy>>;
	now?: () => Date;
}) {
	const now = dependencies.now ?? (() => new Date());
	const policies = {
		...defaultRateLimitPolicies,
		...dependencies.policies,
	};

	return {
		async check(request: RateLimitRequest): Promise<Result<RateLimitDecision>> {
			const policy = policies[request.bucket];

			if (!policy) {
				return fail(
					"RATE_LIMIT_POLICY_NOT_FOUND",
					"Rate limit policy is missing.",
				);
			}

			const identity = normalizeIdentity(request.identity);

			if (!identity) {
				return fail(
					"RATE_LIMIT_IDENTITY_REQUIRED",
					"Rate limit identity is required.",
				);
			}

			const decision = await dependencies.store.consume({
				policy,
				identity,
				now: request.now ?? now(),
			});

			if (!decision.allowed) {
				return fail("RATE_LIMITED", "Too many requests. Try again later.", {
					bucket: request.bucket,
					limit: decision.limit,
					resetAt: decision.resetAt.toISOString(),
					retryAfterSeconds: decision.retryAfterSeconds,
				});
			}

			return ok(decision);
		},
	};
}

function normalizeIdentity(identity: string) {
	return identity.trim().toLowerCase();
}
