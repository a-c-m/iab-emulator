import { test as base } from "@playwright/test";
import type { BuildEmulationOptions } from "../emulation/build-script.js";
import { buildEmulationScript } from "../emulation/build-script.js";
import { getUserAgent } from "../emulation/user-agents.js";
import type { AppScope, Platform } from "../restrictions/schema.js";

export interface IabFixtures {
  iabApps: AppScope[];
  iabEnabled: boolean;
  iabPlatform: Platform;
}

/**
 * Build a Playwright test object whose `page` fixture has the IAB emulation
 * script injected (addInitScript) and the IAB user-agent set. Each fixture is
 * overridable per test via `test.use({ iabEnabled, iabApps, iabPlatform })`.
 *
 * ```ts
 * import { test, expect } from "iab-emulator/playwright";
 * test("popup is blocked", async ({ page }) => { ... });
 * ```
 */
export function createIabFixture(options: BuildEmulationOptions = {}) {
  return base.extend<IabFixtures>({
    iabEnabled: [true, { option: true }],
    iabApps: [options.apps ?? ["*"], { option: true }],
    iabPlatform: [options.platform ?? "ios", { option: true }],

    page: async ({ page, iabEnabled, iabApps, iabPlatform }, use) => {
      if (iabEnabled) {
        const script = buildEmulationScript({
          apps: iabApps,
          platform: iabPlatform,
          categories: options.categories,
        });
        await page.addInitScript(script);
        const primaryApp = iabApps[0] ?? "*";
        await page.setExtraHTTPHeaders({
          "user-agent": getUserAgent(primaryApp, iabPlatform),
        });
      }
      await use(page);
    },
  });
}

/** Pre-built default fixture: emulation ON, every restriction, iOS, Instagram UA. */
export const test = createIabFixture();
export { expect } from "@playwright/test";
