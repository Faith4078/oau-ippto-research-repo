import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	asEntityId,
	auditContextFromRequest,
	jsonResult,
} from "./-helpers.ts";

export const Route = createFileRoute("/api/innovations/$innovationId/publish")({
	server: {
		handlers: {
			POST: async ({
				params,
				request,
			}: {
				params: { innovationId: string };
				request: Request;
			}) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);

				return jsonResult(
					await services.innovationManagement.publishInnovation(
						actorFromSession(session),
						asEntityId(params.innovationId),
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
