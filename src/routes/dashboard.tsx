import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { dashboardDestinationForRoles } from "#/application/dashboard-workspaces.ts";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location }) => {
		const authorization = await requireDashboardRouteAuth({
			locationHref: location.href,
		});

		if (location.pathname.replace(/\/+$/, "") === "/dashboard") {
			throw redirect({
				to: dashboardDestinationForRoles(authorization.user.roles),
			});
		}

		return authorization;
	},
	head: () => ({
		meta: [
			{
				title: "Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Your OAU workspace for research, reviews, innovations, and platform management.",
			},
		],
	}),
	component: () => <Outlet />,
});
