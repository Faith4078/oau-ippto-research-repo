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

	if (
		input.roles?.length &&
		!input.roles.some((role) => user.roles.includes(role))
	) {
		throw redirect({ to: "/dashboard" });
	}

	return { user };
}
