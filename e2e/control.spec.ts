import { expect, test } from "@playwright/test";
import { CLEAN_URL } from "./servers.js";

// Control: plain Playwright against the CLEAN server (no plugin, no fixture).
// Nothing is emulated — the page reports the real browser's behaviour. This is
// the baseline that proves the emulation, not the page, is what changes things.
test.describe("Control (no emulation)", () => {
  test("real browser capabilities are present", async ({ page }) => {
    await page.goto(CLEAN_URL);

    await expect(page.getByTestId("payment-request")).toHaveText("present");
    await expect(page.getByTestId("service-worker")).toHaveText("present");
    await expect(page.getByTestId("server-ua")).not.toContainText("Instagram");
    await expect(page.getByTestId("client-ua")).not.toContainText("Instagram");
    await expect(page.getByTestId("detected-app")).toHaveText("none");

    await page.getByRole("button", { name: "open cross-origin popup" }).click();
    await expect(page.getByTestId("popup-result")).toHaveText("opened");

    await page.getByRole("button", { name: "probe supportsPopups()" }).click();
    await expect(page.getByTestId("popups-result")).toHaveText("supported");

    await page.getByRole("link", { name: "external link", exact: false }).click();
    await expect(page.getByTestId("blank-result")).toHaveText("default");
  });
});
