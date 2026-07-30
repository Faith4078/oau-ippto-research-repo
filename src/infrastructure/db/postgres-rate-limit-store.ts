import { sql } from "drizzle-orm";

import type {
	RateLimitDecision,
	RateLimitPolicy,
	RateLimitStore,
} from "#/application/rate-limit.ts";

import type { Database } from "./index.ts";

type RateLimitWindowRow = {
	count: number | string;
	reset_at: Date | string;
};

export class PostgresRateLimitStore implements RateLimitStore {
	constructor(private readonly database: Database) {}

	async consume(input: {
		policy: RateLimitPolicy;
		identity: string;
		now: Date;
	}): Promise<RateLimitDecision> {
		const key = `${input.policy.bucket}:${input.identity}`;
		const resetAt = new Date(input.now.getTime() + input.policy.windowMs);
		const result = await this.database.execute<RateLimitWindowRow>(sql`
			insert into rate_limit_windows (
				key,
				bucket,
				identity,
				count,
				reset_at,
				updated_at
			)
			values (
				${key},
				${input.policy.bucket},
				${input.identity},
				1,
				${resetAt},
				${input.now}
			)
			on conflict (key) do update set
				count = case
					when rate_limit_windows.reset_at <= excluded.updated_at then 1
					else rate_limit_windows.count + 1
				end,
				reset_at = case
					when rate_limit_windows.reset_at <= excluded.updated_at then excluded.reset_at
					else rate_limit_windows.reset_at
				end,
				updated_at = excluded.updated_at
			returning count, reset_at
		`);

		const row = result.rows[0];

		if (!row) {
			throw new Error("Rate limit window could not be consumed.");
		}

		const count = Number(row.count);
		const windowResetAt =
			row.reset_at instanceof Date ? row.reset_at : new Date(row.reset_at);

		if (count > input.policy.limit) {
			return {
				allowed: false,
				limit: input.policy.limit,
				remaining: 0,
				resetAt: windowResetAt,
				retryAfterSeconds: Math.max(
					1,
					Math.ceil((windowResetAt.getTime() - input.now.getTime()) / 1000),
				),
			};
		}

		return {
			allowed: true,
			limit: input.policy.limit,
			remaining: input.policy.limit - count,
			resetAt: windowResetAt,
		};
	}
}
