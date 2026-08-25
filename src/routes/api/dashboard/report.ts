import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, jsonResult } from "../-helpers.ts";

export const Route = createFileRoute("/api/dashboard/report")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);
				const user =
					session.status === "authenticated" ? session.session.user : null;
				return jsonResult(
					await createRuntimeApplicationServices().reports.getDashboardReport(
						actorFromSession(session),
						{
							scope: {
								departmentId: user?.departmentId ?? null,
								facultyId: user?.facultyId ?? null,
							},
						},
					),
				);
			},
		},
	},
});
