import { defineConfig } from "vite-plus";

// Note: This project uses Next.js and Payload CMS.
// While it doesn't use Vite for its primary build process,
// we use vite-plus (vp) to orchestrate tasks like linting, checking, and running the dev/build scripts.

export default defineConfig({
  run: {
    tasks: {
      "node:dev": {
        command: "cross-env NODE_OPTIONS=--no-deprecation next dev -p 8787",
        cache: false,
      },
      "node:build": {
        command:
          'cross-env NEXT_PUBLIC_IS_BUILDING=true NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build',
      },
      "node:payload": {
        command: "cross-env NODE_OPTIONS=--no-deprecation payload",
      },
      "node:generate:types": {
        command: "pnpm run generate:types:cloudflare && pnpm run generate:types:payload",
      },
      "node:start": {
        command: "cross-env NODE_OPTIONS=--no-deprecation next start",
      },
      "node:test": {
        command: "mkdir -p .open-next/assets && vp exec vitest run --config ./vitest.config.mts",
      },
      "node:test:int": {
        command: "mkdir -p .open-next/assets && vp exec vitest run --config ./vitest.config.mts",
      },
      "node:lint": {
        command: "cross-env NODE_OPTIONS=--no-deprecation next lint",
      },
    },
  },
});
