import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type PluginOption } from "vite";
import neon from "./neon-vite-plugin.ts";

const config = defineConfig(({ command }) => {
	const plugins: Array<PluginOption> = [
		devtools(),
		neon,
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	];

	if (command === "build") {
		plugins.push(nitro({ rollupConfig: { external: [/^@sentry\//] } }));
	}

	return {
		resolve: { tsconfigPaths: true },
		plugins,
	};
});

export default config;
