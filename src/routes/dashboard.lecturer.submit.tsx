import { createFileRoute } from "@tanstack/react-router";

import { ResearchSubmissionForm } from "#/components/dashboard/research-submission-form.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/lecturer/submit")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["lecturer"],
		}),
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
		<main className="min-h-screen bg-[#f0f0f0] p-4 text-[#080808] sm:p-6 lg:p-8">
			<div className="mx-auto max-w-5xl space-y-5">
				<div className="rounded-lg border border-[#d8d8d8] bg-white p-4">
					<a
						className="text-sm font-semibold text-[#146ef5]"
						href="/dashboard/lecturer"
					>
						Back to my research
					</a>
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
		</main>
	);
}
