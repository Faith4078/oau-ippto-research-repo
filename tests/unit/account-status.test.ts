import { describe, expect, it } from "vitest";

import { validateAccountStatusTransition } from "../../src/domain/account-status.ts";

describe("account status transitions", () => {
	it("allows approval and rejection from pending", () => {
		expect(validateAccountStatusTransition("pending", "active", null).ok).toBe(true);
		expect(validateAccountStatusTransition("pending", "rejected", "Staff ID could not be verified.").ok).toBe(true);
	});

	it("requires reasons for adverse account actions", () => {
		const result = validateAccountStatusTransition("active", "suspended", "");
		expect(result).toEqual({ ok: false, message: "A reason is required for this account action." });
	});

	it("rejects unsupported transitions", () => {
		const result = validateAccountStatusTransition("pending", "suspended", "Reason");
		expect(result.ok).toBe(false);
	});
});
