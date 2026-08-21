import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";

import { jsonResult } from "./-helpers.ts";

export const Route = createFileRoute("/api/organization-options")({
	server: {
		handlers: {
			GET: async () =>
				jsonResult(
					await createRuntimeApplicationServices().organizationDirectory.listOptions(),
				),
		},
	},
});
