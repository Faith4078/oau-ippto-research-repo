import { createFileRoute } from "@tanstack/react-router";

import { PublicationAnalyticsPage } from "#/components/dashboard/publication-analytics-page.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/faculty-admin/publication-analytics",
)({
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, [
			"faculty_administrator",
			"super_administrator",
		]);
	},
	head: () => ({
		meta: [
			{
				title:
					"Publication Analytics | Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: FacultyAdminPublicationAnalyticsRoute,
});

function FacultyAdminPublicationAnalyticsRoute() {
	return <PublicationAnalyticsPage view="faculty" />;
}
