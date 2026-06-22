import { defineConfig, devices } from "@playwright/test";
import { CLEAN_URL, PLUGIN_URL } from "./e2e/servers.js";

const PLUGIN_PORT = 5188;
const CLEAN_PORT = 5189;
const isCI = process.env.CI === "true" || process.env.CI === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `pnpm exec vite --config demo/vite.config.ts --port ${PLUGIN_PORT} --strictPort`,
      env: { IAB_DEMO_PLUGIN: "1" },
      url: PLUGIN_URL,
      reuseExistingServer: !isCI,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: `pnpm exec vite --config demo/vite.config.ts --port ${CLEAN_PORT} --strictPort`,
      url: CLEAN_URL,
      reuseExistingServer: !isCI,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
