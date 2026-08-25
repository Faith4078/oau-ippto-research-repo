import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { DashboardPage } from "#/components/dashboard/dashboard-shell.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/lecturer")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["lecturer"],
		}),
	head: () => ({
		meta: [
			{
				title: "Lecturer Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Add research, follow its review progress, and keep your public profile up to date.",
			},
		],
	}),
	component: LecturerDashboard,
});

function LecturerDashboard() {
	const location = useLocation();
	const pathname = location.pathname.replace(/\/+$/, "");

	if (pathname !== "/dashboard/lecturer") {
		return <Outlet />;
	}

	return <DashboardPage workspace={workspaces.lecturer} />;
}
