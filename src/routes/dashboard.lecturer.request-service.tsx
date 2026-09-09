import { createFileRoute, Link } from "@tanstack/react-router";

import { IpttoServiceRequestForm } from "#/components/dashboard/ipto-service-request-form.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/lecturer/request-service")({
	// The "/dashboard" ancestor route already resolved the signed-in user
	// (one network round trip); reuse it from context instead of
	// re-fetching it here.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["lecturer"]);
	},
	head: () => ({
		meta: [
			{
				title: "Request IPTTO Services | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Ask IPTTO for support such as patent filing, commercialization, or prototyping help — for existing or new research.",
			},
		],
	}),
	component: LecturerRequestServicePage,
});

function LecturerRequestServicePage() {
	return (
		<div className="mx-auto max-w-5xl space-y-5">
			<div className="rounded-lg border border-[#d8d8d8] bg-white p-4">
				<Link
					className="text-sm font-semibold text-[#146ef5]"
					to="/dashboard/lecturer"
				>
					Back to my research
				</Link>
				<h1 className="mt-4 text-3xl font-semibold tracking-normal">
					Request IPTTO Services
				</h1>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
					Ask IPTTO for help with patents, commercialization, or prototyping —
					for research you already submitted or research you haven't added yet.
				</p>
			</div>
			<IpttoServiceRequestForm />
		</div>
	);
}
