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

export const Route = createFileRoute("/api/patents/$patentId")({
	server: {
		handlers: {
			PATCH: async ({
				params,
				request,
			}: {
				params: { patentId: string };
				request: Request;
			}) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				return jsonResult(
					await services.innovationManagement.updatePatent(
						actorFromSession(session),
						asEntityId(params.patentId),
						payload,
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
