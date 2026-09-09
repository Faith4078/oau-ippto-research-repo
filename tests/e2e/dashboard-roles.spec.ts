import { expect, test } from "@playwright/test";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

test.setTimeout(240_000);

test("Super Admin sign-in opens the platform operations workspace", async ({
	page,
}) => {
	test.skip(
		!process.env.SUPER_ADMIN_STAFF_ID || !process.env.SUPER_ADMIN_PASSWORD,
		"Local Super Admin credentials are not configured.",
	);

	await page.goto("/sign-in", {
		waitUntil: "domcontentloaded",
		timeout: 120_000,
	});
	await page.getByLabel("Staff ID").fill(process.env.SUPER_ADMIN_STAFF_ID ?? "");
	await page
		.getByLabel("Password", { exact: true })
		.fill(process.env.SUPER_ADMIN_PASSWORD ?? "");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/dashboard\/super-admin$/, { timeout: 120_000 });
	await expect(
		page.getByRole("heading", { name: "Platform access and operations" }),
	).toBeVisible();
	await expect(page.getByText("Account requests", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Set administrator responsibility" }),
	).toBeVisible();
	await expect(
		page.getByText("Automatic work needing attention", { exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "Refresh" }).first().click();
});

test("clicking into the dashboard from another page renders without a reload", async ({
	page,
}) => {
	// Regression test: navigating to a dashboard route via a real in-app
	// <Link> click (not a hard page load) used to leave the previous page's
	// content on screen indefinitely, because every dashboard route in the
	// hierarchy independently re-ran the getDashboardAuthUser auth check for
	// a single navigation -- once per matched route, and again for
	// intent-preload -- turning one navigation into a chain of sequential
	// network round trips that a slow one could stall forever. A manual
	// reload always "fixed" it because a fresh SSR request only pays for the
	// check once. See requireDashboardRole/requireDashboardRouteAuth in
	// src/lib/auth-functions.ts.
	test.skip(
		!process.env.SUPER_ADMIN_STAFF_ID || !process.env.SUPER_ADMIN_PASSWORD,
		"Local Super Admin credentials are not configured.",
	);

	await page.goto("/sign-in", {
		waitUntil: "domcontentloaded",
		timeout: 120_000,
	});
	await page.getByLabel("Staff ID").fill(process.env.SUPER_ADMIN_STAFF_ID ?? "");
	await page
		.getByLabel("Password", { exact: true })
		.fill(process.env.SUPER_ADMIN_PASSWORD ?? "");
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/dashboard\/super-admin$/, { timeout: 120_000 });

	// Leave the dashboard entirely (a full page load of the public
	// homepage), then come back via the "Dashboard" nav link -- a pure
	// client-side navigation into the dashboard route tree from a
	// completely different, already-hydrated page.
	await page.goto("/", { waitUntil: "domcontentloaded" });
	const dashboardLink = page.getByRole("link", { name: "Open dashboard" });
	await expect(dashboardLink).toBeVisible({ timeout: 30_000 });
	await dashboardLink.click();

	await expect(page).toHaveURL(/\/dashboard\/super-admin$/, {
		timeout: 15_000,
	});
	await expect(
		page.getByRole("heading", { name: "Platform access and operations" }),
	).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText("Signed in as", { exact: true })).toBeVisible({
		timeout: 5_000,
	});
});
