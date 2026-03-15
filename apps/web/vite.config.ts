import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { paraglideVitePlugin } from "@inlang/paraglide-js";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";

const config = defineConfig({
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url", "baseLocale"],
    }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    contentCollections(),

    tailwindcss(),
    tanstackStart(),
    viteReact(),
    (!process.env.VITEST && alchemy()) as any,
  ].filter(Boolean),
  server: {
    port: 3001,
  },
});

export default config;
