import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "#/components/dashboard/dashboard-shell.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/faculty-admin")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator", "super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Faculty administrator dashboard preview for review queues, faculty reports, cross-department output, and approvals.",
			},
		],
	}),
	component: FacultyAdminDashboard,
});

function FacultyAdminDashboard() {
	return <DashboardPage workspace={workspaces["faculty-admin"]} />;
}
