import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { DashboardPage } from "#/components/dashboard/dashboard-shell.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({ locationHref: location.href }),
	head: () => ({
		meta: [
			{
				title: "Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Authenticated staff dashboard preview for the OAU IPTTO Research Repository.",
			},
		],
	}),
	component: DashboardIndex,
});

function DashboardIndex() {
	const location = useLocation();
	const pathname = location.pathname.replace(/\/+$/, "");

	if (pathname !== "/dashboard") {
		return <Outlet />;
	}

	return <DashboardPage workspace={workspaces.lecturer} />;
}
