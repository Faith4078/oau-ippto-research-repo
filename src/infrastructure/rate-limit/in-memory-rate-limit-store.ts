import type {
	RateLimitDecision,
	RateLimitPolicy,
	RateLimitStore,
} from "#/application/rate-limit.ts";

type RateLimitWindow = {
	count: number;
	resetAt: Date;
};

export class InMemoryRateLimitStore implements RateLimitStore {
	private readonly windows = new Map<string, RateLimitWindow>();

	async consume(input: {
		policy: RateLimitPolicy;
		identity: string;
		now: Date;
	}): Promise<RateLimitDecision> {
		const key = `${input.policy.bucket}:${input.identity}`;
		const existing = this.windows.get(key);

		if (!existing || existing.resetAt <= input.now) {
			const resetAt = new Date(input.now.getTime() + input.policy.windowMs);
			this.windows.set(key, { count: 1, resetAt });

			return {
				allowed: true,
				limit: input.policy.limit,
				remaining: input.policy.limit - 1,
				resetAt,
			};
		}

		if (existing.count >= input.policy.limit) {
			return {
				allowed: false,
				limit: input.policy.limit,
				remaining: 0,
				resetAt: existing.resetAt,
				retryAfterSeconds: Math.max(
					1,
					Math.ceil((existing.resetAt.getTime() - input.now.getTime()) / 1000),
				),
			};
		}

		existing.count += 1;

		return {
			allowed: true,
			limit: input.policy.limit,
			remaining: input.policy.limit - existing.count,
			resetAt: existing.resetAt,
		};
	}
}
