import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { AuthUser } from "#/application/auth/session.ts";
import { dashboardRoleAssignmentsForUser } from "#/application/dashboard-workspaces.ts";
import type {
	DashboardReportScope,
	PublicationAnalyticsRange,
} from "#/application/reports.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import { actorFromSession, jsonResult } from "../-helpers.ts";

const rangeSchema = z.enum(["30d", "90d", "180d", "365d"]);
const viewSchema = z.enum(["department", "faculty", "super"]);

type PublicationAnalyticsView = z.infer<typeof viewSchema>;

export const Route = createFileRoute("/api/dashboard/publication-analytics")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);
				const user =
					session.status === "authenticated" ? session.session.user : null;
				const url = new URL(request.url);
				const range = parseRange(url.searchParams.get("range"));
				const view = parseView(url.searchParams.get("view"));

				return jsonResult(
					await createRuntimeApplicationServices().reports.getPublicationAnalytics(
						actorFromSession(session),
						{
							range,
							scope: publicationAnalyticsScopeForView(user, view),
						},
					),
				);
			},
		},
	},
});

function parseRange(value: string | null): PublicationAnalyticsRange {
	const parsed = rangeSchema.safeParse(value ?? "365d");
	return parsed.success ? parsed.data : "365d";
}

function parseView(value: string | null): PublicationAnalyticsView {
	const parsed = viewSchema.safeParse(value ?? "super");
	return parsed.success ? parsed.data : "super";
}

function publicationAnalyticsScopeForView(
	user: AuthUser | null,
	view: PublicationAnalyticsView,
): DashboardReportScope {
	if (!user) {
		return { departmentId: null, facultyId: null };
	}

	if (user.roles.includes("super_administrator")) {
		return { departmentId: null, facultyId: null };
	}

	const roleAssignments = dashboardRoleAssignmentsForUser(user);

	if (view === "department") {
		const departmentAssignment = roleAssignments.find(
			(assignment) =>
				assignment.role === "department_administrator" &&
				Boolean(assignment.departmentId),
		);

		return {
			departmentId: departmentAssignment?.departmentId ?? user.departmentId,
			facultyId: null,
		};
	}

	if (view === "faculty") {
		const facultyAssignment = roleAssignments.find(
			(assignment) =>
				assignment.role === "faculty_administrator" &&
				Boolean(assignment.facultyId),
		);

		return {
			departmentId: null,
			facultyId: facultyAssignment?.facultyId ?? user.facultyId,
		};
	}

	return { departmentId: null, facultyId: null };
}
