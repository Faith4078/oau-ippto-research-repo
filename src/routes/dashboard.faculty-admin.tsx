import { createFileRoute } from "@tanstack/react-router";

import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/faculty-admin")({
	// The parent "/dashboard" route already resolved the signed-in user (one
	// network round trip); reuse it from context instead of re-fetching it
	// here, which used to double the auth work done for every navigation.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, [
			"faculty_administrator",
			"super_administrator",
		]);
	},
	head: () => ({
		meta: [
			{
				title: "Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Review faculty research, compare departments, and create clear reports.",
			},
		],
	}),
	component: FacultyAdminDashboard,
});

function FacultyAdminDashboard() {
	return <ResearchReviewWorkspace stage="faculty" />;
}
