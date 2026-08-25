import { expect, test } from "@playwright/test";

test("homepage exposes repository discovery paths", async ({ page }) => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", {
			name: /Find OAU Research, Researchers, and Innovations/i,
		}),
	).toBeVisible();
	await expect(page.getByRole("searchbox")).toBeVisible();
	await expect(page.getByRole("link", { name: /Find a Researcher/i })).toBeVisible();
});

test("homepage remains usable on mobile", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("link", { name: /OAU IPTTO/i })).toBeVisible();
	await expect(page.getByRole("searchbox")).toBeVisible();
});
