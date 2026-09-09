"use client";

import { createFileRoute } from "@tanstack/react-router";

import { DepartmentDetailPage } from "#/components/dashboard/admin-detail-pages.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/super-admin/departments/$departmentId",
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
					"Department Detail | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminDepartmentDetailRoute,
});

function SuperAdminDepartmentDetailRoute() {
	const { departmentId } = Route.useParams();

	return <DepartmentDetailPage departmentId={departmentId} scope="super" />;
}
