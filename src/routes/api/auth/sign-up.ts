import { createFileRoute } from "@tanstack/react-router";

import { handleStaffSignUpRequest } from "#/lib/auth-signup.ts";

export const Route = createFileRoute("/api/auth/sign-up")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) =>
				handleStaffSignUpRequest(request),
		},
	},
});
