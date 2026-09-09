"use client";

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { OrganizationManagementPage } from "#/components/dashboard/organization-management-page.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/super-admin/faculties")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Faculties | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminFacultiesRoute,
});

function SuperAdminFacultiesRoute() {
	const location = useLocation();
	const isList = location.pathname === "/dashboard/super-admin/faculties";

	return isList ? (
		<OrganizationManagementPage resource="faculties" scope="super" />
	) : (
		<Outlet />
	);
}
