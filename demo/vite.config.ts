import type { Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";
import { iabEmulator } from "../src/integrations/vite.js";

// Echoes the request user-agent at /echo-ua. Registered after iabEmulator so it
// observes the spoofed UA when the plugin is enabled — lets the e2e prove the
// server-side UA spoof end to end.
function echoUserAgent(): Plugin {
  return {
    name: "demo-echo-ua",
    configureServer(server) {
      server.middlewares.use("/echo-ua", (req, res) => {
        res.setHeader("content-type", "text/plain");
        res.end(req.headers["user-agent"] ?? "");
      });
    },
  };
}

/**
 * Build the demo Vite config. `plugin` injects the emulation; `chrome` adds the
 * visual IAB frame. Shared by the env-driven default export (used by the e2e
 * webServers and `pnpm demo`) and the flag-free `demo/vite.iab.config.ts` that
 * `pnpm try` launches.
 */
export function createDemoConfig({
  plugin,
  chrome,
}: {
  chrome: boolean;
  plugin: boolean;
}): UserConfig {
  return {
    root: import.meta.dirname,
    server: {
      // main.ts imports iab-emulator from ../src (outside the demo root).
      fs: { allow: [".."] },
    },
    plugins: plugin
      ? [iabEmulator({ apps: ["meta-ig"], platform: "ios", chrome }), echoUserAgent()]
      : [echoUserAgent()],
  };
}

// The SAME app serves several ways via env vars, so the e2e can boot each mode:
//   IAB_DEMO_PLUGIN=1 vite            -> emulation auto-injected (plugin mode)
//   IAB_DEMO_PLUGIN=1 IAB_DEMO_CHROME=1 -> ...plus the IAB frame overlay
//   vite                             -> clean page (for the Playwright-fixture path)
const pluginEnabled = process.env.IAB_DEMO_PLUGIN === "1";
const chromeEnabled = process.env.IAB_DEMO_CHROME === "1";

export default defineConfig(createDemoConfig({ plugin: pluginEnabled, chrome: chromeEnabled }));
