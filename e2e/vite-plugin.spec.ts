import { expect, test } from "@playwright/test";
import { PLUGIN_URL } from "./servers.js";

// Vite plugin mode: plain Playwright (no fixture). Emulation is auto-injected by
// the iab-emulator Vite plugin into the served HTML, and the dev server's request
// user-agent is spoofed.
test.describe("Vite plugin mode (IAB on via dev server)", () => {
  test("auto-injects the emulation script and spoofs the server UA", async ({ page }) => {
    await page.goto(PLUGIN_URL);

    await expect(page.locator("script[data-iab-emulator]")).toHaveCount(1);
    await expect(page.getByTestId("server-ua")).toContainText("Instagram");
    await expect(page.getByTestId("client-ua")).toContainText("Instagram");
    await expect(page.getByTestId("detected-app")).toHaveText("meta-ig");
    await expect(page.getByTestId("payment-request")).toHaveText("absent");
    await expect(page.getByTestId("service-worker")).toHaveText("absent");

    await page.getByRole("button", { name: "open cross-origin popup" }).click();
    await expect(page.getByTestId("popup-result")).toHaveText("blocked");

    await page.getByRole("button", { name: "probe supportsPopups()" }).click();
    await expect(page.getByTestId("popups-result")).toHaveText("blocked");
  });
});
