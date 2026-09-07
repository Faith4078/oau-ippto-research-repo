import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	asEntityId,
	auditContextFromRequest,
	jsonResult,
} from "../-helpers.ts";

const entityIdRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reviewSchema = z.object({
	userId: z.string().trim().regex(entityIdRegex, "Invalid user ID."),
	status: z.enum(["active", "rejected", "suspended", "deactivated"]),
	reason: z.string().trim().max(2000).nullable().optional(),
});

export const Route = createFileRoute("/api/admin/accounts")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				return jsonResult(
					await services.accountAdministration.listPending(
						actorFromSession(session),
					),
				);
			},
			POST: async ({ request }: { request: Request }) => {
				const parsed = reviewSchema.safeParse(
					await request.json().catch(() => null),
				);
				if (!parsed.success) {
					return Response.json(
						{
							error: {
								code: "VALIDATION_FAILED",
								message: "Check the account action fields.",
								fieldErrors: z.flattenError(parsed.error).fieldErrors,
							},
						},
						{ status: 422 },
					);
				}
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				return jsonResult(
					await services.accountAdministration.review(
						actorFromSession(session),
						{
							...parsed.data,
							...auditContextFromRequest(request),
							reason: parsed.data.reason ?? null,
							userId: asEntityId(parsed.data.userId),
						},
					),
				);
			},
		},
	},
});
