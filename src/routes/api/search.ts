import { createFileRoute } from "@tanstack/react-router";

import { rateLimitBuckets } from "#/application/rate-limit.ts";
import {
	createSearchService,
	type SearchRequest,
} from "#/application/search.ts";
import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { PostgresResearchSearchIndex } from "#/infrastructure/db/research-search.ts";

import { enforceRateLimit, jsonResult, readJsonBody } from "./-helpers.ts";

export const Route = createFileRoute("/api/search")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const limited = await enforceRateLimit(
					request,
					rateLimitBuckets.search,
				);

				if (limited) {
					return limited;
				}

				const service = createSearchService({
					searchIndex: new PostgresResearchSearchIndex(
						createDatabase(requireDatabaseUrl()),
					),
				});

				const payload = (await readJsonBody(request)) as SearchRequest;

				return jsonResult(await service.searchPublic(payload));
			},
		},
	},
});
