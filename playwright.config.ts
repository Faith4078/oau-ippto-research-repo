import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	expect: {
		timeout: 10_000,
	},
	timeout: 120_000,
	fullyParallel: true,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile-chrome",
			use: { ...devices["Pixel 7"] },
		},
	],
	reporter: [["list"], ["html", { open: "never" }]],
	testDir: "./tests/e2e",
	use: {
		baseURL: "http://127.0.0.1:3000",
		navigationTimeout: 120_000,
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm dev --host 127.0.0.1",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		url: "http://127.0.0.1:3000",
	},
});
