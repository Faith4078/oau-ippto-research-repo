"use client";

import { createFileRoute } from "@tanstack/react-router";

import { UserDetailPage } from "#/components/dashboard/admin-detail-pages.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard/faculty-admin/users/$userId")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title:
					"User Detail | Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
		],
	}),
	component: FacultyAdminUserDetailRoute,
});

function FacultyAdminUserDetailRoute() {
	const { userId } = Route.useParams();

	return <UserDetailPage scope="faculty" userId={userId} />;
}
