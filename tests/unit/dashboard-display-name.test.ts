import { describe, expect, it } from "vitest";

import { formatDashboardName } from "#/presentation/dashboard/display-name.ts";

describe("formatDashboardName", () => {
	it("removes academic titles and abbreviates the last name", () => {
		expect(formatDashboardName("Dr. Adebayo Adeyemi")).toBe("Adebayo A.");
		expect(formatDashboardName("Dr. A. Adeyemi")).toBe("Adeyemi A.");
		expect(formatDashboardName("Prof Funmilayo Oladipo (Lecturer)")).toBe(
			"Funmilayo O.",
		);
	});

	it("keeps a single name without adding punctuation", () => {
		expect(formatDashboardName("Lecturer")).toBe("Lecturer");
	});
});
