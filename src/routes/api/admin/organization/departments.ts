import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { createOrganizationManagementService } from "#/application/organization-management.ts";
import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { PostgresOrganizationManagementRepository } from "#/infrastructure/db/organization-management-repository.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, asEntityId, jsonResult } from "../../-helpers.ts";

const entityIdRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const entityIdField = z
	.string()
	.trim()
	.regex(entityIdRegex, "Invalid ID format.");

const departmentSchema = z.object({
	code: z.string().trim().max(32).nullable().optional(),
	description: z.string().trim().max(1000).nullable().optional(),
	facultyId: entityIdField.nullable().optional(),
	name: z.string().trim().min(2).max(160),
});

const departmentUpdateSchema = departmentSchema.extend({ id: entityIdField });

export const Route = createFileRoute("/api/admin/organization/departments")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const service = createOrganizationService();
				const session = await readAuthSession(request);
				return jsonResult(
					await service.listDepartments(
						actorFromSession(session),
						listFilters(request),
					),
				);
			},
			PATCH: async ({ request }: { request: Request }) => {
				const parsed = departmentUpdateSchema.safeParse(
					await request.json().catch(() => null),
				);
				if (!parsed.success)
					return validationError("Check the department fields.");

				const service = createOrganizationService();
				const session = await readAuthSession(request);
				return jsonResult(
					await service.updateDepartment(
						actorFromSession(session),
						asEntityId(parsed.data.id),
						parsed.data,
					),
				);
			},
			POST: async ({ request }: { request: Request }) => {
				const parsed = departmentSchema.safeParse(
					await request.json().catch(() => null),
				);
				if (!parsed.success)
					return validationError("Check the department fields.");

				const service = createOrganizationService();
				const session = await readAuthSession(request);
				return jsonResult(
					await service.createDepartment(
						actorFromSession(session),
						parsed.data,
					),
				);
			},
		},
	},
});

function createOrganizationService() {
	return createOrganizationManagementService(
		new PostgresOrganizationManagementRepository(
			createDatabase(requireDatabaseUrl()),
		),
	);
}

function listFilters(request: Request) {
	const url = new URL(request.url);
	const facultyId = url.searchParams.get("facultyId");
	return {
		facultyId:
			facultyId && entityIdRegex.test(facultyId) ? asEntityId(facultyId) : null,
		search: url.searchParams.get("search"),
	};
}

function validationError(message: string) {
	return Response.json(
		{ error: { code: "VALIDATION_FAILED", message } },
		{ status: 422 },
	);
}
