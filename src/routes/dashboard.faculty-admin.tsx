import { createFileRoute } from "@tanstack/react-router";

import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

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
					"Review faculty research, compare departments, and create clear reports.",
			},
		],
	}),
	component: FacultyAdminDashboard,
});

function FacultyAdminDashboard() {
	return <ResearchReviewWorkspace stage="faculty" />;
}
