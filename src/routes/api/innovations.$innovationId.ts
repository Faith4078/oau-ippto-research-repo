import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	asEntityId,
	auditContextFromRequest,
	jsonResult,
	readJsonBody,
} from "./-helpers.ts";

export const Route = createFileRoute("/api/innovations/$innovationId")({
	server: {
		handlers: {
			PATCH: async ({
				params,
				request,
			}: {
				params: { innovationId: string };
				request: Request;
			}) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				return jsonResult(
					await services.innovationManagement.updateInnovation(
						actorFromSession(session),
						asEntityId(params.innovationId),
						payload,
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
