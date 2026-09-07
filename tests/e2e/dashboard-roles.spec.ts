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
	await page.getByLabel("Password").fill(process.env.SUPER_ADMIN_PASSWORD ?? "");
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
