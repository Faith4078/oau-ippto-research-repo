import { describe, expect, it } from "vitest";

import { authorizeSession } from "#/application/auth/guards.ts";
import { createAuthenticatedSessionState } from "#/application/auth/session.ts";

describe("auth guards", () => {
	it("explains when a pending account has not been approved", () => {
		const result = authorizeSession(
			createAuthenticatedSessionState({
				expiresAt: new Date(Date.now() + 60_000),
				id: "00000000-0000-4000-8000-000000000001",
				issuedAt: null,
				user: {
					departmentId: "00000000-0000-4000-8000-000000000020",
					email: "lecturer@example.edu",
					facultyId: "00000000-0000-4000-8000-000000000010",
					id: "00000000-0000-4000-8000-000000000002",
					name: "Dr Pending Lecturer",
					roleAssignments: [
						{
							departmentId: "00000000-0000-4000-8000-000000000020",
							facultyId: "00000000-0000-4000-8000-000000000010",
							role: "lecturer",
						},
					],
					roles: ["lecturer"],
					staffId: "ac/1234",
					status: "pending",
				},
			}),
			{ permissions: ["dashboard:access"], match: "every" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "AUTH_USER_INACTIVE",
				message:
					"Your account has not been approved yet. A super administrator must approve it before you can sign in.",
			},
		});
	});
});
