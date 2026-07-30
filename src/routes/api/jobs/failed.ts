import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, jsonResult } from "../-helpers.ts";

export const Route = createFileRoute("/api/jobs/failed")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const url = new URL(request.url);
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);

				return jsonResult(
					await services.backgroundJobs.listFailedJobs(
						actorFromSession(session),
						{
							page: Number(url.searchParams.get("page") ?? 1),
							pageSize: Number(url.searchParams.get("pageSize") ?? 25),
						},
					),
				);
			},
		},
	},
});
