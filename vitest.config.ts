import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"#": resolve(root, "src"),
			"@": resolve(root, "src"),
		},
	},
	test: {
		coverage: {
			exclude: [
				"src/routeTree.gen.ts",
				"src/routes/**",
				"src/components/ui/**",
				"tests/**",
				"*.config.ts",
			],
			include: ["src/**/*.{ts,tsx}"],
			provider: "v8",
			reporter: ["text", "html"],
		},
		environment: "jsdom",
		include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
		setupFiles: ["./tests/setup/vitest.setup.ts"],
	},
});
