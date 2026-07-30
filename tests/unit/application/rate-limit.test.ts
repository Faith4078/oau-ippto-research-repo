import { describe, expect, it } from "vitest";

import {
	createRateLimiterService,
	rateLimitBuckets,
} from "../../../src/application/rate-limit.ts";
import { InMemoryRateLimitStore } from "../../../src/infrastructure/rate-limit/in-memory-rate-limit-store.ts";

describe("rate limiter application service", () => {
	it("allows requests until the configured bucket limit is exhausted", async () => {
		const service = createRateLimiterService({
			store: new InMemoryRateLimitStore(),
			policies: {
				auth: {
					bucket: rateLimitBuckets.auth,
					limit: 2,
					windowMs: 60_000,
				},
			},
		});
		const now = new Date("2026-07-30T10:00:00.000Z");

		const first = await service.check({
			bucket: rateLimitBuckets.auth,
			identity: "AC/1234",
			now,
		});
		const second = await service.check({
			bucket: rateLimitBuckets.auth,
			identity: "ac/1234",
			now,
		});
		const third = await service.check({
			bucket: rateLimitBuckets.auth,
			identity: "AC/1234",
			now,
		});

		expect(first.ok ? first.value.remaining : null).toBe(1);
		expect(second.ok ? second.value.remaining : null).toBe(0);
		expect(third).toEqual({
			ok: false,
			error: {
				code: "RATE_LIMITED",
				message: "Too many requests. Try again later.",
				cause: {
					bucket: "auth",
					limit: 2,
					resetAt: "2026-07-30T10:01:00.000Z",
					retryAfterSeconds: 60,
				},
			},
		});
	});

	it("defines the required endpoint buckets", () => {
		expect(rateLimitBuckets).toEqual({
			auth: "auth",
			signedUploadUrl: "signed_upload_url",
			signedDownloadUrl: "signed_download_url",
			search: "search",
		});
	});
});
