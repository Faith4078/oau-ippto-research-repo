"use client";

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { OrganizationManagementPage } from "#/components/dashboard/organization-management-page.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/faculty-admin/departments")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Department Management | Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: FacultyDepartmentsRoute,
});

function FacultyDepartmentsRoute() {
	const location = useLocation();
	const isList = location.pathname === "/dashboard/faculty-admin/departments";

	return isList ? (
		<OrganizationManagementPage resource="departments" scope="faculty" />
	) : (
		<Outlet />
	);
}
