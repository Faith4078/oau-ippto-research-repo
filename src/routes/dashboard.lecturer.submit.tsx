import { createFileRoute, Link } from "@tanstack/react-router";

import { ResearchSubmissionForm } from "#/components/dashboard/research-submission-form.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/lecturer/submit")({
	// The "/dashboard" ancestor route already resolved the signed-in user
	// (one network round trip); reuse it from context instead of
	// re-fetching it here.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["lecturer"]);
	},
	head: () => ({
		meta: [
			{
				title: "Submit Research | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content: "Add and publish research on the OAU research site.",
			},
		],
	}),
	component: LecturerResearchSubmissionPage,
});

function LecturerResearchSubmissionPage() {
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
					Add Research
				</h1>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
					Add clear details, attach the document, and publish the research for
					people to find.
				</p>
			</div>
			<ResearchSubmissionForm />
		</div>
	);
}
