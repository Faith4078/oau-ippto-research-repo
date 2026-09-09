"use client";

import { createFileRoute, Link } from "@tanstack/react-router";

import { LecturerProfileForm } from "#/components/dashboard/lecturer-profile-form.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/lecturer/profile")({
	// The "/dashboard" ancestor route already resolved the signed-in user
	// (one network round trip); reuse it from context instead of
	// re-fetching it here.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["lecturer"]);
	},
	head: () => ({
		meta: [
			{
				title: "My Profile | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Update your public profile details and picture, shown to anyone who views your published research.",
			},
		],
	}),
	component: LecturerProfilePage,
});

function LecturerProfilePage() {
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
					My Profile
				</h1>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
					Update your details and picture. This is what people see when they
					click your name from a research page.
				</p>
			</div>

			<LecturerProfileForm />
		</div>
	);
}
