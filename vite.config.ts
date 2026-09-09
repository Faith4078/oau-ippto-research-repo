import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type PluginOption } from "vite";
import neon from "./neon-vite-plugin.ts";

const publicPrerenderPaths = [
	"/",
	"/research",
	"/researchers",
	"/publications",
	"/departments",
	"/faculties",
	"/innovations",
	"/patents",
	"/reports",
	"/news",
	"/research-areas",
	"/faq",
	"/contact",
];

const config = defineConfig(({ command }) => {
  const plugins: Array<PluginOption> = [
    tsconfigPaths(),
    devtools(),
    neon,
    tailwindcss(),
    tanstackStart({
      // Nitro owns production prerendering for this deployment. TanStack's
      // preview-based prerenderer expects its default dist/server output, while
      // Nitro emits the deployable server under .output/server.
      prerender: {
        enabled: false,
      },
    }),
    viteReact(),
  ];

  if (command === "build") {
    plugins.push(
      nitro({
        prerender: {
          concurrency: 1,
          crawlLinks: false,
          failOnError: true,
          routes: publicPrerenderPaths,
        },
        rollupConfig: { external: [/^@sentry\//] },
      }),
    );
  }

  return {
    plugins,
  };
});

export default config;