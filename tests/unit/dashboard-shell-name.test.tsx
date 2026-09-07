import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { workspaces } from "#/presentation/dashboard/data.ts";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("DashboardShell signed-in name", () => {
	it.each([
		["lecturer", "Amina Adeyemi", "Amina A."],
		["iptto-officer", "Bola Ajayi", "Bola A."],
	] as const)(
		"shows the %s account name as first name and last initial",
		async (role, accountName, expectedName) => {
			vi.stubGlobal(
				"matchMedia",
				vi.fn().mockReturnValue({
					addEventListener: vi.fn(),
					matches: true,
					removeEventListener: vi.fn(),
				}),
			);
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue(
					new Response(
						JSON.stringify({
							data: {
								name: accountName,
							},
						}),
						{ headers: { "content-type": "application/json" }, status: 200 },
					),
				),
			);

			render(
				<DashboardShell workspace={workspaces[role]}>
					<p>Dashboard content</p>
				</DashboardShell>,
			);

			expect((await screen.findAllByText(expectedName)).length).toBeGreaterThan(
				0,
			);
			expect(fetch).toHaveBeenCalledWith("/api/dashboard/me", {
				cache: "no-store",
			});
		},
	);
});
