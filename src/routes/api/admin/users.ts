import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { createUserAccessService } from "#/application/user-access.ts";
import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { PostgresUserAccessRepository } from "#/infrastructure/db/user-access-repository.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, jsonResult } from "../-helpers.ts";

const entityIdRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const entityIdField = z.string().trim().regex(entityIdRegex, "Invalid ID format.");

const accessSchema = z.object({
	departmentId: entityIdField.nullable(),
	facultyId: entityIdField.nullable(),
	role: z.enum([
		"lecturer",
		"department_administrator",
		"faculty_administrator",
		"iptto_officer",
	]),
	userId: entityIdField,
});

export const Route = createFileRoute("/api/admin/users")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const service = createUserAccessService(
					new PostgresUserAccessRepository(
						createDatabase(requireDatabaseUrl()),
					),
				);
				return jsonResult(
					await service.list(actorFromSession(await readAuthSession(request))),
				);
			},
			POST: async ({ request }: { request: Request }) => {
				const parsed = accessSchema.safeParse(
					await request.json().catch(() => null),
				);
				if (!parsed.success)
					return Response.json(
						{
							error: {
								code: "VALIDATION_FAILED",
								message:
									"Choose a staff member, role, and required organization.",
							},
						},
						{ status: 422 },
					);
				const service = createUserAccessService(
					new PostgresUserAccessRepository(
						createDatabase(requireDatabaseUrl()),
					),
				);
				return jsonResult(
					await service.setAccess(
						actorFromSession(await readAuthSession(request)),
						parsed.data,
					),
				);
			},
		},
	},
});
