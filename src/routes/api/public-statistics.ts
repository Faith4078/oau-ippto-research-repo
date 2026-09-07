import { createFileRoute } from "@tanstack/react-router";

import type { PublicRepositoryStats } from "#/application/reports.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";

import { jsonResult, publicRevalidationHeaders } from "./-helpers.ts";

const cacheTtlMs = 5 * 60 * 1000;
let cachedStats:
	| {
			expiresAt: number;
			value: PublicRepositoryStats;
	  }
	| undefined;

export const Route = createFileRoute("/api/public-statistics")({
	server: {
		handlers: {
			GET: async () => {
				if (cachedStats && cachedStats.expiresAt > Date.now()) {
					return Response.json(
						{
							data: cachedStats.value,
							cache: {
								status: "hit",
								ttlSeconds: Math.floor(
									(cachedStats.expiresAt - Date.now()) / 1000,
								),
							},
						},
						{ headers: publicRevalidationHeaders },
					);
				}

				const services = createRuntimeApplicationServices();
				const result = await services.reports.getPublicRepositoryStats();

				if (result.ok) {
					cachedStats = {
						expiresAt: Date.now() + cacheTtlMs,
						value: result.value,
					};
				}

				return jsonResult(result, { headers: publicRevalidationHeaders });
			},
		},
	},
});
