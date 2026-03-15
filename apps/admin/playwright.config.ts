import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env.local") });
dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

process.env.NEXT_PUBLIC_MOCK_CHECKOUT = process.env.NEXT_PUBLIC_MOCK_CHECKOUT ?? "true";
process.env.NEXT_PUBLIC_E2E_TEST_SECRET = process.env.NEXT_PUBLIC_E2E_TEST_SECRET ?? "test-secret";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 100000,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:8787",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_COMMAND ?? "pnpm dev",
    env: {
      ...process.env,
      DEBUG: "pw:webserver",
      NEXT_PUBLIC_MOCK_CHECKOUT: process.env.NEXT_PUBLIC_MOCK_CHECKOUT ?? "true",
      NEXT_PUBLIC_E2E_TEST_SECRET: process.env.NEXT_PUBLIC_E2E_TEST_SECRET ?? "test-secret",
    },
    reuseExistingServer: true,
    timeout: 300 * 1000,
    url: "http://localhost:8787/admin/login",
  },
});
