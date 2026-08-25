import { expect, test } from "@playwright/test";

test("staff sign-in page exposes Staff ID password access", async ({ page }) => {
	await page.goto("/sign-in", { waitUntil: "domcontentloaded" });

	await expect(
		page.getByRole("heading", { name: /Staff Sign In/i }),
	).toBeVisible();
	await expect(page.getByLabel(/Staff ID/i)).toBeVisible();
	await expect(
		page.getByText(/Lecturers: AC\/ plus 4 digits/i),
	).toBeVisible();
	await expect(
		page.getByText(/IPTTO and platform staff: AT\/ plus 4 digits/i),
	).toBeVisible();
	await expect(page.getByLabel(/Password/i)).toBeVisible();
	await expect(page.getByRole("link", { name: /Forgot your password/i })).toHaveAttribute(
		"href",
		"/forgot-password",
	);
	await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
});

test("forgot password page captures exact AC or AT staff ID format", async ({
	page,
}) => {
	await page.goto("/forgot-password");

	await expect(
		page.getByRole("heading", { name: /Forgot Password/i }),
	).toBeVisible();
	await expect(page.getByLabel(/Staff ID/i)).toHaveAttribute(
		"pattern",
		"(AC|AT)/[0-9]{4}",
	);
	await expect(
		page.getByText(/Lecturers: AC\/ plus 4 digits/i),
	).toBeVisible();
	await expect(
		page.getByText(/IPTTO and platform staff: AT\/ plus 4 digits/i),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Send reset instructions/i }),
	).toBeVisible();
});

test("reset password page explains the exact password policy", async ({
	page,
}) => {
	await page.goto("/reset-password?token=test-token");

	await expect(
		page.getByRole("heading", { name: /Reset Password/i }),
	).toBeVisible();
	await expect(page.locator('input[name="token"]')).toHaveValue("test-token");
	await expect(page.getByLabel(/New password/i)).toHaveAttribute(
		"maxlength",
		"8",
	);
	await expect(page.getByText("Exactly 8 characters", { exact: true })).toBeVisible();
	await expect(
		page.getByText("At least one uppercase letter", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText("At least one lowercase letter", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText("At least one number", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText("At least one special symbol", { exact: true }),
	).toBeVisible();
});

test("lecturer signup page captures required AC staff fields", async ({
	page,
}) => {
	await page.goto("/sign-up/lecturer", { waitUntil: "networkidle" });

	await expect(
		page.getByRole("heading", { name: /Lecturer Sign Up/i }),
	).toBeVisible();
	await expect(page.getByLabel(/First name/i)).toBeVisible();
	await expect(page.getByLabel(/Last name/i)).toBeVisible();
	await expect(page.getByLabel(/Staff ID/i)).toHaveAttribute(
		"placeholder",
		"AC/1234",
	);
	await expect(page.getByLabel(/Staff ID/i)).toHaveAttribute(
		"pattern",
		"AC/[0-9]{4}",
	);
	await expect(page.getByLabel(/Faculty/i)).toBeVisible();
	await expect(page.getByLabel(/Department/i)).toBeVisible();
	await expect(page.getByLabel(/Password/i)).toHaveAttribute("minlength", "8");
	await expect(page.getByLabel(/Password/i)).toHaveAttribute("maxlength", "8");
	await expect(page.getByText("Exactly 8 characters", { exact: true })).toBeVisible();
	await expect(
		page.getByText("At least one special symbol", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText(/Enter AC\/ followed by your 4 staff ID digits/i),
	).toBeVisible();
});

test("IPTTO signup page captures required AT staff fields", async ({ page }) => {
	await page.goto("/sign-up/iptto");

	await expect(
		page.getByRole("heading", { name: /IPTTO Sign Up/i }),
	).toBeVisible();
	await expect(page.getByLabel(/^Name$/i)).toBeVisible();
	await expect(page.getByLabel(/Staff ID/i)).toHaveAttribute(
		"placeholder",
		"AT/1302",
	);
	await expect(page.getByLabel(/Staff ID/i)).toHaveAttribute(
		"pattern",
		"AT/[0-9]{4}",
	);
	await expect(page.getByLabel(/Password/i)).toHaveAttribute("minlength", "8");
	await expect(page.getByLabel(/Password/i)).toHaveAttribute("maxlength", "8");
	await expect(page.getByText("Exactly 8 characters", { exact: true })).toBeVisible();
	await expect(
		page.getByText("At least one special symbol", { exact: true }),
	).toBeVisible();
	await expect(
		page.getByText(/Enter AT\/ followed by your 4 staff ID digits/i),
	).toBeVisible();
});

test("anonymous dashboard access redirects to sign in", async ({ page }) => {
	await page.goto("/dashboard/lecturer");

	await expect(page).toHaveURL(/\/sign-in/);
	await expect(page.getByLabel(/Staff ID/i)).toBeVisible();
});
