import type { Plugin } from "vite";
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

// Gate the iab-emulator plugin on an env var so the SAME app serves two ways:
//   IAB_DEMO_PLUGIN=1 vite  -> emulation auto-injected (plugin mode)
//   vite                    -> clean page (for the Playwright-fixture path)
const pluginEnabled = process.env.IAB_DEMO_PLUGIN === "1";
// Separate gate so the IAB frame overlay is opt-in and never affects the e2e
// runs (which set IAB_DEMO_PLUGIN only): IAB_DEMO_CHROME=1 draws the frame.
const chromeEnabled = process.env.IAB_DEMO_CHROME === "1";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    // main.ts imports iab-emulator from ../src (outside the demo root).
    fs: { allow: [".."] },
  },
  plugins: pluginEnabled
    ? [iabEmulator({ apps: ["meta-ig"], platform: "ios", chrome: chromeEnabled }), echoUserAgent()]
    : [echoUserAgent()],
});
