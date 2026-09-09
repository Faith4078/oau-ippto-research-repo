import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { loadResearchReviewQueue } from "#/application/dashboard-workspaces.ts";
import { requireDatabaseUrl } from "#/db/env.ts";
import { PostgresDashboardWorkspaceRepository } from "#/infrastructure/db/dashboard-workspace-repository.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { jsonResult } from "../-helpers.ts";

const stageSchema = z.enum(["department", "iptto"]);

export const Route = createFileRoute("/api/dashboard/research-review")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);
				if (session.status !== "authenticated") {
					return Response.json(
						{
							error: {
								code: "AUTHENTICATION_REQUIRED",
								message: "Sign in to view research awaiting review.",
							},
						},
						{ status: 401 },
					);
				}

				const stage = stageSchema.safeParse(
					new URL(request.url).searchParams.get("stage"),
				);
				if (!stage.success) {
					return Response.json(
						{
							error: {
								code: "INVALID_REVIEW_STAGE",
								message: "Choose a valid research review stage.",
							},
						},
						{ status: 422 },
					);
				}

				const repository = new PostgresDashboardWorkspaceRepository(
					createDatabase(requireDatabaseUrl()),
				);
				return jsonResult(
					await loadResearchReviewQueue(
						{
							departmentId: session.session.user.departmentId,
							facultyId: session.session.user.facultyId,
							roleAssignments: session.session.user.roleAssignments,
							roles: session.session.user.roles,
						},
						stage.data,
						repository,
					),
				);
			},
		},
	},
});
