"use client";

import { createFileRoute } from "@tanstack/react-router";

import { UserRoleDirectory } from "#/components/dashboard/user-role-directory.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/super-admin/users")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"Users by Role | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminUsersRoute,
});

function SuperAdminUsersRoute() {
	return <UserRoleDirectory scope="super" />;
}
