import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { authorizeSession } from "#/application/auth/guards.ts";
import type { RoleKey, UserStatus } from "#/domain/organization.ts";

import { readAuthSession } from "./auth-server.ts";

export type DashboardAuthUser = {
	id: string;
	staffId: string;
	name: string;
	email: string | null;
	status: UserStatus;
	roles: readonly RoleKey[];
	departmentId: string | null;
	facultyId: string | null;
};

export const getDashboardAuthUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardAuthUser | null> => {
		const request = getRequest();
		const sessionState = await readAuthSession(request);
		const authorization = authorizeSession(sessionState, {
			permissions: ["dashboard:access"],
			match: "every",
		});

		if (!authorization.ok) {
			return null;
		}

		return authorization.value.session.user;
	},
);

// Only the top-level "/dashboard" layout route should call this: it is the
// one place that hits the network (the getDashboardAuthUser RPC, which in
// turn reads the auth session and queries the database). Nested dashboard
// routes receive the already-resolved user through route context and use
// requireDashboardRole below, which is a synchronous, no-I/O check. Calling
// this from every nested route independently used to mean a single
// navigation fired the same auth round trip once per matched route (plus
// once more for TanStack Router's intent-preload pass), which is what made
// clicking into a dashboard feel like it never rendered until a hard reload
// bailed everyone out with a single fresh SSR request instead.
export async function requireDashboardRouteAuth(input: {
	locationHref: string;
	roles?: readonly RoleKey[];
}) {
	const user = await getDashboardAuthUser();

	if (!user) {
		throw redirect({
			to: "/sign-in",
			search: {
				redirect: input.locationHref,
			},
		});
	}

	requireDashboardRole(user, input.roles);

	return { user };
}

// Synchronous role gate for nested dashboard routes that already have the
// user from their parent's route context (see requireDashboardRouteAuth).
export function requireDashboardRole(
	user: DashboardAuthUser,
	roles?: readonly RoleKey[],
) {
	if (roles?.length && !roles.some((role) => user.roles.includes(role))) {
		throw redirect({ to: "/dashboard" });
	}
}
