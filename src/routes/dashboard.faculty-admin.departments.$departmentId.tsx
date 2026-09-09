"use client";

import { createFileRoute } from "@tanstack/react-router";

import { DepartmentDetailPage } from "#/components/dashboard/admin-detail-pages.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/faculty-admin/departments/$departmentId",
)({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Department Detail | Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: FacultyAdminDepartmentDetailRoute,
});

function FacultyAdminDepartmentDetailRoute() {
	const { departmentId } = Route.useParams();

	return <DepartmentDetailPage departmentId={departmentId} scope="faculty" />;
}