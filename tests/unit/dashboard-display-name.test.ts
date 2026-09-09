import { describe, expect, it } from "vitest";

import { formatDashboardName } from "#/presentation/dashboard/display-name.ts";

describe("formatDashboardName", () => {
	it("removes academic titles while keeping the full name", () => {
		expect(formatDashboardName("Dr. Adebayo Adeyemi")).toBe(
			"Adebayo Adeyemi",
		);
		expect(formatDashboardName("Dr. A. Adeyemi")).toBe("A. Adeyemi");
		expect(formatDashboardName("Prof Funmilayo Oladipo (Lecturer)")).toBe(
			"Funmilayo Oladipo",
		);
	});

	it("keeps a single name without adding punctuation", () => {
		expect(formatDashboardName("Lecturer")).toBe("Lecturer");
	});
});
