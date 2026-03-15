import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

if (!process.env.PAYLOAD_SECRET) {
  process.env.PAYLOAD_SECRET = "test-secret";
}

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
}

export default defineWorkersConfig({
  define: {
    "process.env.STRIPE_SECRET_KEY": JSON.stringify(
      process.env.STRIPE_SECRET_KEY ?? "sk_test_mock",
    ),
    "process.env.PAYLOAD_SECRET": JSON.stringify(process.env.PAYLOAD_SECRET ?? "test-secret"),
  },
  resolve: {
    external: ["dotenv"],
  },
  optimizeDeps: {
    exclude: ["dotenv"],
  },
  ssr: {
    external: ["dotenv"],
  },
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/int/**/*.int.spec.ts"],
    pool: "@cloudflare/vitest-pool-workers",
    env: {},
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        compatibilityFlags: ["nodejs_compat"],
        miniflare: {
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? "test-secret",
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_mock",
          },
        },
      },
    },
  },
});
