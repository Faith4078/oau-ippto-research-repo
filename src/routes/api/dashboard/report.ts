import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { AuthUser } from "#/application/auth/session.ts";
import { dashboardRoleAssignmentsForUser } from "#/application/dashboard-workspaces.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, jsonResult } from "../-helpers.ts";

const reportStageSchema = z.enum(["department", "faculty", "iptto"]).nullable();

export const Route = createFileRoute("/api/dashboard/report")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);
				const user =
					session.status === "authenticated" ? session.session.user : null;
				const stage = reportStageSchema.safeParse(
					new URL(request.url).searchParams.get("stage"),
				);
				return jsonResult(
					await createRuntimeApplicationServices().reports.getDashboardReport(
						actorFromSession(session),
						{
							scope: dashboardReportScopeForStage(
								user,
								stage.success ? stage.data : null,
							),
						},
					),
				);
			},
		},
	},
});

function dashboardReportScopeForStage(
	user: AuthUser | null,
	stage: "department" | "faculty" | "iptto" | null,
) {
	if (!user || stage === "iptto") {
		return { departmentId: null, facultyId: null };
	}

	const roleAssignments = dashboardRoleAssignmentsForUser(user);

	if (stage === "department") {
		const departmentAssignment = roleAssignments.find(
			(assignment) => assignment.role === "department_administrator",
		);
		return {
			departmentId: departmentAssignment?.departmentId ?? user.departmentId,
			facultyId: null,
		};
	}

	if (stage === "faculty") {
		const facultyAssignment = roleAssignments.find(
			(assignment) => assignment.role === "faculty_administrator",
		);
		return {
			departmentId: null,
			facultyId: facultyAssignment?.facultyId ?? user.facultyId,
		};
	}

	return {
		departmentId: user.departmentId,
		facultyId: user.facultyId,
	};
}
