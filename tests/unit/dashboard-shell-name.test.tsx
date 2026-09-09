import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { workspaces } from "#/presentation/dashboard/data.ts";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

// DashboardShell renders <Link> for its logo and sidebar navigation, which
// requires a router context to be mounted. Wrap it in a minimal in-memory
// router instead of rendering it bare.
function renderWithRouter(ui: ReactElement) {
	const rootRoute = createRootRoute({ component: () => ui });
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: ["/"] }),
		routeTree: rootRoute,
	});

	return render(<RouterProvider router={router} />);
}

describe("DashboardShell signed-in name", () => {
	it("shows a loading identity instead of the demo persona before account data resolves", async () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockReturnValue({
				addEventListener: vi.fn(),
				matches: true,
				removeEventListener: vi.fn(),
			}),
		);
		vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

		renderWithRouter(
			<DashboardShell workspace={workspaces.lecturer}>
				<p>Dashboard content</p>
			</DashboardShell>,
		);

		expect(
			(await screen.findAllByText("Loading signed-in user")).length,
		).toBeGreaterThan(0);
		expect(screen.queryByText("A. Adeyemi")).toBeNull();
		expect(screen.queryByText("Amina Adeyemi")).toBeNull();
		expect(fetch).toHaveBeenCalledWith("/api/dashboard/me", {
			cache: "no-store",
		});
	});

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

			renderWithRouter(
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
