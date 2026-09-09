import { createFileRoute } from "@tanstack/react-router";

import { PublicationAnalyticsPage } from "#/components/dashboard/publication-analytics-page.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute(
	"/dashboard/super-admin/publication-analytics",
)({
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["super_administrator"]);
	},
	head: () => ({
		meta: [
			{
				title:
					"Publication Analytics | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: SuperAdminPublicationAnalyticsRoute,
});

function SuperAdminPublicationAnalyticsRoute() {
	return <PublicationAnalyticsPage view="super" />;
}
