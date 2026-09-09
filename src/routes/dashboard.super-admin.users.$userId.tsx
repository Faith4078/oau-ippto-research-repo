"use client";

import { createFileRoute } from "@tanstack/react-router";

import { UserDetailPage } from "#/components/dashboard/admin-detail-pages.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/super-admin/users/$userId")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"User Detail | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminUserDetailRoute,
});

function SuperAdminUserDetailRoute() {
	const { userId } = Route.useParams();

	return <UserDetailPage scope="super" userId={userId} />;
}
