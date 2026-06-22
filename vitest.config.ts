import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**/*.ts"],
      exclude: [
        // Barrels are pure re-exports — nothing to cover.
        "src/**/index.ts",
        // Framework adapters are smoke-tested + e2e'd, not unit-covered: their
        // bodies only run inside a live Vite/Next/webpack/Playwright runtime.
        // (options.ts is pure logic — kept in coverage.)
        "src/integrations/vite.ts",
        "src/integrations/next.ts",
        "src/integrations/webpack.ts",
        "src/integrations/playwright.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
