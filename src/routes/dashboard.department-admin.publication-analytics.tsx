                                                                                                                                                                            import { createFileRoute } from "@tanstack/react-router";

import { PublicationAnalyticsPage } from "#/components/dashboard/publication-analytics-page.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/department-admin/publication-analytics",
)({
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, [
			"department_administrator",
			"super_administrator",
		]);
	},
	head: () => ({
		meta: [
			{
				title:
					"Publication Analytics | Department Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: DepartmentAdminPublicationAnalyticsRoute,
});

function DepartmentAdminPublicationAnalyticsRoute() {
	return <PublicationAnalyticsPage view="department" />;
}
