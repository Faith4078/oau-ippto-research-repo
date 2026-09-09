import { describe, expect, it } from "vitest";

import {
	handleStaffPasswordResetComplete,
	handleStaffPasswordResetRequest,
} from "../../src/lib/staff-password-reset.ts";

describe("staff password reset", () => {
	it("rejects malformed staff IDs before touching the database", async () => {
		const response = await handleStaffPasswordResetRequest(
			new Request("http://localhost/api/auth/staff-password-reset/request", {
				body: JSON.stringify({ staffId: "AT/102" }),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(422);
		expect(payload.error.fieldErrors.staffId).toContain(
			"Staff ID must use AC/ or AT/ followed by exactly 4 digits, for example AC/1234 or AT/1302.",
		);
	});

	it("keeps reset passwords on the shared minimum length policy", async () => {
		const response = await handleStaffPasswordResetComplete(
			new Request("http://localhost/api/auth/staff-password-reset/complete", {
				body: JSON.stringify({
					password: "short",
					token: "reset-token",
				}),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(422);
		expect(payload.error.fieldErrors.password).toContain(
			"Password must be at least 8 characters.",
		);
	});
});
