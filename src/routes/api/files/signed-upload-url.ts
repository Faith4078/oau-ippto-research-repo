import { createFileRoute } from "@tanstack/react-router";

import { rateLimitBuckets } from "#/application/rate-limit.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	auditContextFromRequest,
	enforceRateLimit,
	jsonResult,
	readJsonBody,
} from "../-helpers.ts";

export const Route = createFileRoute("/api/files/signed-upload-url")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const limited = await enforceRateLimit(
					request,
					rateLimitBuckets.signedUploadUrl,
				);

				if (limited) {
					return limited;
				}

				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				return jsonResult(
					await services.researchWorkflow.createSignedUploadUrl(
						actorFromSession(session),
						payload,
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
