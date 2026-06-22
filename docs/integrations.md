# Integrations

All integrations share the same options: `apps`, `platform`, `categories`
(filter the manifest) and `enabled`. They default to ON unless `IAB_EMULATOR=0`
or `--no-iab` is set.

**User-agent spoofing covers both sides.** The injected emulation script
overrides the page's `navigator.userAgent` (so client-side detection —
`iab-emulator/detect` or your own sniffing — sees the in-app browser), and the
Vite/Playwright integrations additionally spoof the *request* user-agent for
server-side sniffing. Disable the client override with `userAgent: false` (or,
in Vite, `spoofUserAgent: false`, which disables both).

## Vite — `iab-emulator/vite`

```ts
import { iabEmulator } from "iab-emulator/vite";

export default {
  plugins: [
    iabEmulator({
      apps: ["meta-ig"], // which IAB to emulate
      platform: "ios", // "ios" | "android"
      categories: ["navigation", "payments"], // optional subset
      spoofUserAgent: true, // default — spoof the dev-server request UA
    }),
  ],
};
```

`apply: "serve"` — dev only. It injects the emulation script into the served
HTML and (unless `spoofUserAgent: false`) rewrites the request user-agent.

## Playwright — `iab-emulator/playwright`

```ts
import { test, expect } from "iab-emulator/playwright"; // default: Instagram iOS

test("popup blocked", async ({ page }) => {
  /* ... */
});

// Per-test override:
test.use({ iabPlatform: "android", iabApps: ["tiktok"] });

// Opt out:
test.use({ iabEnabled: false });

// Custom default fixture:
import { createIabFixture } from "iab-emulator/playwright";
export const test = createIabFixture({ apps: ["meta-ig", "tiktok"], platform: "ios" });
```

The fixture calls `page.addInitScript(...)` (emulation runs before page scripts)
and `page.setExtraHTTPHeaders({ "user-agent": ... })`.

> Multi-app note: with multiple `apps`, the restriction sets are unioned but the
> spoofed user-agent is the **first** app's only (`apps[0]`). So
> `apps: ["meta-ig", "tiktok"]` applies both sets while presenting the Instagram
> UA. Put the app whose UA you want to test first.

## Next.js — `iab-emulator/next` (experimental)

> **Experimental.** Unlike Vite/Playwright, this wrapper does the build-time half
> only — it exposes the script + UA as env values and you wire the injection
> yourself. The recipe below works but is less turnkey; treat it as a starting
> point until a first-class injection helper ships.

The wrapper exposes the script and UA as build-time env values; it does **not**
inject them itself, because Next's injection points move between major versions.

```ts
// next.config.mjs
import { withIabEmulator } from "iab-emulator/next";

export default withIabEmulator({ /* your config */ }, { apps: ["meta-ig"] });
```

This sets `process.env.__IAB_EMULATOR_SCRIPT__` and `__IAB_EMULATOR_UA__` at build
time. Inject the script via middleware (recommended — no `_document` edit):

```ts
// middleware.ts
import { NextResponse } from "next/server";

export function middleware() {
  const res = NextResponse.next();
  const script = process.env.__IAB_EMULATOR_SCRIPT__;
  if (script) {
    // Inject via your HTML-rewriting strategy of choice, e.g. an
    // HTMLRewriter on the streamed response, or a <Script> in the root layout
    // guarded by `process.env.NODE_ENV !== "production"`.
  }
  return res;
}
```

For the App Router, the simplest path is a dev-only `<script>` in the root
layout reading `process.env.__IAB_EMULATOR_SCRIPT__`.

## webpack — `iab-emulator/webpack`

Requires [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
in the build (the plugin injects into its generated HTML). If it's absent, the
plugin no-ops with a warning.

```js
// webpack.config.js
const { IabEmulatorWebpackPlugin } = require("iab-emulator/webpack");

module.exports = {
  plugins: [
    new HtmlWebpackPlugin(),
    new IabEmulatorWebpackPlugin({ apps: ["meta-ig"], platform: "ios" }),
  ],
};
```

> Note: `iab-emulator` is ESM-only. In a CommonJS webpack config, load it with a
> dynamic `import()` or run the config as ESM (`webpack.config.mjs`).
