import { createFileRoute } from "@tanstack/react-router";

import { handleStaffPasswordResetComplete } from "#/lib/staff-password-reset.ts";

export const Route = createFileRoute("/api/auth/staff-password-reset/complete")(
	{
		server: {
			handlers: {
				POST: async ({ request }: { request: Request }) =>
					handleStaffPasswordResetComplete(request),
			},
		},
	},
);
