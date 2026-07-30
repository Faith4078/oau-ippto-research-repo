import { createFileRoute } from "@tanstack/react-router";

import { handleStaffPasswordResetRequest } from "#/lib/staff-password-reset.ts";

export const Route = createFileRoute("/api/auth/staff-password-reset/request")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) =>
				handleStaffPasswordResetRequest(request),
		},
	},
});
