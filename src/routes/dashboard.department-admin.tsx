import { createFileRoute } from "@tanstack/react-router";

import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/department-admin")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["department_administrator", "super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "Department Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Review department research, give feedback, and approve work that is ready.",
			},
		],
	}),
	component: DepartmentAdminDashboard,
});

function DepartmentAdminDashboard() {
	return <ResearchReviewWorkspace stage="department" />;
}
