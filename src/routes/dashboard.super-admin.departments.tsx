"use client";

import { createFileRoute } from "@tanstack/react-router";

import { OrganizationManagementPage } from "#/components/dashboard/organization-management-page.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/super-admin/departments")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Departments | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminDepartmentsRoute,
});

function SuperAdminDepartmentsRoute() {
	return <OrganizationManagementPage resource="departments" scope="super" />;
}
