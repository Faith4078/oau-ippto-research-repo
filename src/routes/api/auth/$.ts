import { createFileRoute } from "@tanstack/react-router";

import { rateLimitBuckets } from "#/application/rate-limit.ts";
import { auth } from "#/lib/auth-runtime.ts";

import { enforceRateLimit } from "../-helpers.ts";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const limited = await enforceRateLimit(request, rateLimitBuckets.auth);

				if (limited) {
					return limited;
				}

				return auth.handler(request);
			},
			POST: async ({ request }: { request: Request }) => {
				const limited = await enforceRateLimit(request, rateLimitBuckets.auth);

				if (limited) {
					return limited;
				}

				return auth.handler(request);
			},
		},
	},
});
