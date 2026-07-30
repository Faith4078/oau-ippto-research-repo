import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "#/components/dashboard/dashboard-shell.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/super-admin")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "Super Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Super administrator dashboard preview for users, roles, permissions, faculties, departments, settings, audit logs, and failed jobs.",
			},
		],
	}),
	component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
	return <DashboardPage workspace={workspaces["super-admin"]} />;
}
