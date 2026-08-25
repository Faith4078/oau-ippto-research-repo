import { createFileRoute } from "@tanstack/react-router";

import { IpttoWorkspace } from "#/components/dashboard/iptto-workspace.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/iptto-officer")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["iptto_officer", "super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "IPTTO Officer Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"IPTTO officer dashboard preview for innovations, patents, commercialization activity, reviews, and supporting files.",
			},
		],
	}),
	component: IpttoOfficerDashboard,
});

function IpttoOfficerDashboard() {
	return <IpttoWorkspace />;
}
