import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase, schema } from "#/infrastructure/db/index.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

export const Route = createFileRoute("/api/dashboard/me")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);

				if (session.status !== "authenticated") {
					return Response.json(
						{
							error: {
								code: "AUTHENTICATION_REQUIRED",
								message: "Sign in to view dashboard identity.",
							},
						},
						{ status: 401 },
					);
				}

				const user = session.session.user;
				const organizationNames = await readOrganizationNames({
					departmentId: user.departmentId,
					facultyId: user.facultyId,
				});

				return Response.json({
					data: {
						id: user.id,
						staffId: user.staffId,
						name: user.name,
						email: user.email,
						roles: user.roles,
						roleAssignments: user.roleAssignments,
						departmentId: user.departmentId,
						facultyId: user.facultyId,
						departmentName: organizationNames.departmentName,
						facultyName: organizationNames.facultyName,
					},
				});
			},
		},
	},
});

// The lecturer top bar shows the department/faculty by name, but the
// session identity only carries their ids—resolve the names here so callers
// don't need a second round trip to a profile endpoint.
async function readOrganizationNames(input: {
	departmentId: string | null;
	facultyId: string | null;
}) {
	if (!input.departmentId && !input.facultyId) {
		return { departmentName: null, facultyName: null };
	}

	const database = createDatabase(requireDatabaseUrl());

	const [departmentRows, facultyRows] = await Promise.all([
		input.departmentId
			? database
					.select({ name: schema.departments.name })
					.from(schema.departments)
					.where(eq(schema.departments.id, input.departmentId))
					.limit(1)
			: Promise.resolve([]),
		input.facultyId
			? database
					.select({ name: schema.faculties.name })
					.from(schema.faculties)
					.where(eq(schema.faculties.id, input.facultyId))
					.limit(1)
			: Promise.resolve([]),
	]);

	return {
		departmentName: departmentRows[0]?.name ?? null,
		facultyName: facultyRows[0]?.name ?? null,
	};
}
