"use client";

import { createFileRoute } from "@tanstack/react-router";

import { FacultyDetailPage } from "#/components/dashboard/admin-detail-pages.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/super-admin/faculties/$facultyId",
)({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Faculty Detail | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminFacultyDetailRoute,
});

function SuperAdminFacultyDetailRoute() {
	const { facultyId } = Route.useParams();

	return <FacultyDetailPage facultyId={facultyId} />;
}
