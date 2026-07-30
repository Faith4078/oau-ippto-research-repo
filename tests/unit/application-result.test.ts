import { describe, expect, it } from "vitest";
import { fail, ok } from "../../src/application/result.ts";

describe("application result helpers", () => {
	it("wraps successful values in a predictable success shape", () => {
		expect(ok({ id: "record-1" })).toEqual({
			ok: true,
			value: { id: "record-1" },
		});
	});

	it("wraps failures in a predictable error shape", () => {
		const cause = new Error("missing permission");

		expect(fail("FORBIDDEN", "User cannot publish this record", cause)).toEqual({
			ok: false,
			error: {
				code: "FORBIDDEN",
				message: "User cannot publish this record",
				cause,
			},
		});
	});
});
