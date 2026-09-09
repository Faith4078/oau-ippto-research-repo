"use client";

import { createFileRoute } from "@tanstack/react-router";

import { UserRoleDirectory } from "#/components/dashboard/user-role-directory.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/faculty-admin/users")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Users by Role | Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: FacultyUsersRoute,
});

function FacultyUsersRoute() {
	return <UserRoleDirectory scope="faculty" />;
}
