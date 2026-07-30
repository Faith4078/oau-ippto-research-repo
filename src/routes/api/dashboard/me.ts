import { createFileRoute } from "@tanstack/react-router";

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

				return Response.json({
					data: {
						id: user.id,
						staffId: user.staffId,
						name: user.name,
						email: user.email,
						roles: user.roles,
						departmentId: user.departmentId,
						facultyId: user.facultyId,
					},
				});
			},
		},
	},
});
