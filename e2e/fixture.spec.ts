import { expect, test } from "../src/integrations/playwright.js";
import { CLEAN_URL } from "./servers.js";

// Fixture mode: emulation is injected by the iab-emulator Playwright fixture
// (addInitScript) against the CLEAN demo server (no Vite plugin). The fixture
// also spoofs the request user-agent via extra HTTP headers, which the
// server-ua probe echoes back.
test.describe("Playwright fixture mode (IAB on, Instagram iOS)", () => {
  test("applies IAB restrictions to a clean page", async ({ page }) => {
    await page.goto(CLEAN_URL);

    await expect(page.getByTestId("payment-request")).toHaveText("absent");
    await expect(page.getByTestId("service-worker")).toHaveText("absent");
    await expect(page.getByTestId("server-ua")).toContainText("Instagram");

    // Client-side detection now works: the injected script overrides
    // navigator.userAgent, so detectIAB() resolves the app in-page.
    await expect(page.getByTestId("client-ua")).toContainText("Instagram");
    await expect(page.getByTestId("detected-app")).toHaveText("meta-ig");

    await page.getByRole("button", { name: "open cross-origin popup" }).click();
    await expect(page.getByTestId("popup-result")).toHaveText("blocked");

    await page.getByRole("button", { name: "probe supportsPopups()" }).click();
    await expect(page.getByTestId("popups-result")).toHaveText("blocked");

    await page.getByRole("link", { name: "external link", exact: false }).click();
    await expect(page.getByTestId("blank-result")).toHaveText("suppressed");
  });
});
