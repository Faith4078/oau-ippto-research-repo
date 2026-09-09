"use client";

import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/super-admin/organization")({
	beforeLoad: async ({ location }) => {
		await requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		});
		throw redirect({ to: "/dashboard/super-admin/faculties" });
	},
	head: () => ({
		meta: [
			{
				title:
					"Organization Management | Super Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: () => null,
});
