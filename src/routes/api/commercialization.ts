import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	auditContextFromRequest,
	jsonResult,
	readJsonBody,
} from "./-helpers.ts";

export const Route = createFileRoute("/api/commercialization")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				return jsonResult(
					await services.innovationManagement.createCommercializationActivity(
						actorFromSession(session),
						payload,
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
