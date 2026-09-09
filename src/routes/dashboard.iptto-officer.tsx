import { createFileRoute } from "@tanstack/react-router";

import { IpttoWorkspace } from "#/components/dashboard/iptto-workspace.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/iptto-officer")({
	// The parent "/dashboard" route already resolved the signed-in user (one
	// network round trip); reuse it from context instead of re-fetching it
	// here, which used to double the auth work done for every navigation.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, [
			"iptto_officer",
			"super_administrator",
		]);
	},
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
