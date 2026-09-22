# iab-emulator

> Emulate social in-app-browser restrictions in local dev and Playwright tests.

When users tap your Meta, TikTok, or LinkedIn ads, they land on your page
inside an **in-app browser** (IAB) — not Chrome or Safari. These embedded
WKWebView/WebView browsers silently break popups, payment flows, OAuth, and a
range of browser APIs. `iab-emulator` reproduces those restrictions locally, so
you find them before your users do.

> **Status:** `0.1.0` — usable, but the manifest and plugin API may evolve
> before `1.0.0`. Pin to `~0.1.0`.

## What it covers

11 documented restrictions across navigation, payments, storage, and browser
APIs, on iOS and Android. Sourced from [caniwebview.com](https://caniwebview.com),
WebKit/Apple references, and confirmed production incidents. Full list:
[docs/restrictions.md](docs/restrictions.md).

**Apps** — detection and user-agent spoofing support six in-app browsers:
**Meta** (Facebook & Instagram), **TikTok**, **LinkedIn**, **Snapchat**, and
**Pinterest**. Most restrictions are platform-wide (`apps: ["*"]`); a few are
Meta-specific. App-specific restriction entries for the others are welcome —
see [CONTRIBUTING.md](CONTRIBUTING.md). Until then, selecting a non-Meta app
mainly steers the spoofed UA.

## Install

```sh
npm install --save-dev iab-emulator
# or: pnpm add -D iab-emulator
```

Node ≥22, ESM-only.

## Quick start

### Vite (dev server — on by default)

```ts
// vite.config.ts
import { iabEmulator } from "iab-emulator/vite";

export default {
  plugins: [iabEmulator({ apps: ["meta-ig"], platform: "ios" })],
};
```

Injects the emulation script into the served HTML and spoofs the dev-server
request user-agent.

### Playwright (E2E — on by default)

```ts
import { test, expect } from "iab-emulator/playwright";

test("checkout shows a fallback when the popup is blocked", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByTestId("iab-payment-warning")).toBeVisible();
});
```

Override per test with `test.use({ iabPlatform: "android", iabApps: ["tiktok"] })`,
or opt out with `test.use({ iabEnabled: false })`.

### Runtime detection (in your app)

```ts
import { detectIAB, getCapabilities } from "iab-emulator/detect";

const { isIAB, app } = detectIAB(); // e.g. { isIAB: true, app: "meta-ig" }
if (isIAB) {
  // render the in-app-browser-safe path
}
```

`iab-emulator/detect` has zero runtime dependencies and is safe to ship in a
browser bundle.

## Opting out

```sh
IAB_EMULATOR=0 vite dev      # env toggle
vite dev --no-iab          # CLI flag
```

```ts
test.use({ iabEnabled: false }); // Playwright, per test/file
iabEmulator({ enabled: false });   // explicit
```

## Other integrations

- **Next.js** — `iab-emulator/next` (`withIabEmulator`). **Experimental:** the
  wrapper exposes the emulation script + UA as build-time env values but does
  **not** inject them — you wire that up via middleware or your root layout (see
  the docs). Vite/Playwright are the fully-supported paths.
- **webpack** — `iab-emulator/webpack` (`IabEmulatorWebpackPlugin`, needs
  html-webpack-plugin)

Setup details: [docs/integrations.md](docs/integrations.md).

## See it working

A runnable demo app + Playwright suite under `demo/` and `e2e/` exercise three
modes against the same capability-dashboard page:

- **Vite plugin mode** — `iabEmulator()` auto-injects emulation into the dev server.
- **Playwright fixture mode** — `iab-emulator/playwright` injects via `addInitScript`.
- **Control** — a clean server with no emulation, proving the difference.

```sh
pnpm demo                       # open the dashboard yourself (clean)
IAB_DEMO_PLUGIN=1 pnpm demo     # ...with the Vite plugin active
pnpm exec playwright install chromium
pnpm test:e2e                   # run all three modes
```

## Contributing a restriction

The manifest grows through PRs. See [CONTRIBUTING.md](CONTRIBUTING.md) — the
short version: add an entry to the right category file following the schema,
write a test, and open a PR titled `feat(restrictions): add <id>`.

## License

[MIT](LICENSE)
