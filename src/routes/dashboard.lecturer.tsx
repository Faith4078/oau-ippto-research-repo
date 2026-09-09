import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { LecturerWorkspace } from "#/components/dashboard/lecturer-workspace.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/lecturer")({
	// The parent "/dashboard" route already resolved the signed-in user (one
	// network round trip); reuse it from context instead of re-fetching it
	// here, which used to double the auth work done for every navigation.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["lecturer"]);
	},
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
	const isIndexRoute = pathname === "/dashboard/lecturer";

	// The shell (sidebar + topbar) must stay mounted across every
	// /dashboard/lecturer/* route so navigating between "My Research",
	// "Add Research", "Edit", and "Profile" feels like switching tabs
	// inside the dashboard instead of leaving it.
	return (
		<DashboardShell workspace={workspaces.lecturer}>
			{isIndexRoute ? <LecturerWorkspace /> : <Outlet />}
		</DashboardShell>
	);
}
