import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	expect: {
		timeout: 10_000,
	},
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
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm dev",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		url: "http://localhost:3000",
	},
});
