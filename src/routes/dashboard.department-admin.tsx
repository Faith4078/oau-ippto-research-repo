import { createFileRoute } from "@tanstack/react-router";

import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/department-admin")({
	// The parent "/dashboard" route already resolved the signed-in user (one
	// network round trip); reuse it from context instead of re-fetching it
	// here, which used to double the auth work done for every navigation.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, [
			"department_administrator",
			"super_administrator",
		]);
	},
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
