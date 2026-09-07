import { expect, test } from "@playwright/test";

test("homepage exposes repository discovery paths", async ({ page }) => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", {
			name: /Find OAU Research, Researchers, and Innovations/i,
		}),
	).toBeVisible();
	await expect(page.getByRole("link", { name: /Find a Researcher/i })).toBeVisible();
	await expect(
		page.getByRole("img", {
			name: /University research faculty deliberating/i,
		}),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Add Your Research" })).toHaveAttribute(
		"href",
		"/sign-in",
	);
});

test("homepage remains usable on mobile", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("link", { name: /OAU IPTTO/i })).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Search Research/i }).first(),
	).toBeVisible();
});

test("homepage uses stable loading skeletons for live repository metrics", async ({
	page,
}) => {
	await page.route("**/api/public-statistics", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 1_000));
		await route.continue();
	});

	await page.goto("/");

	await expect(page.getByText("Loading Published Research").first()).toBeAttached();
	await expect(
		page.locator(".hero-stage").getByRole("link", { name: "Search Research" }),
	).toHaveCount(0);
	await expect(page.locator(".hero-panel .metric-tile strong").first()).toHaveText(
		/\d+/,
	);
});
