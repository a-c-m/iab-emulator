import type { Plugin } from "vite";
import { buildEmulationScript } from "../emulation/build-script.js";
import { getUserAgent } from "../emulation/user-agents.js";
import { htmlScriptTag, type IabIntegrationOptions, resolveEnabled } from "./options.js";

export interface IabViteOptions extends IabIntegrationOptions {
  /** Spoof the dev-server request user-agent to the IAB's. Default: true. */
  spoofUserAgent?: boolean | undefined;
}

/**
 * Vite dev-server plugin (apply: "serve"). Injects the emulation script into
 * the served HTML and, by default, spoofs the request user-agent so server-side
 * UA sniffing also sees the in-app browser.
 *
 * ```ts
 * // vite.config.ts
 * import { iabEmulator } from "iab-emulator/vite";
 * export default { plugins: [iabEmulator({ apps: ["meta-ig"], platform: "ios" })] };
 * ```
 */
export function iabEmulator(options: IabViteOptions = {}): Plugin {
  if (!resolveEnabled(options.enabled)) {
    return { name: "iab-emulator:disabled" };
  }

  const apps = options.apps ?? ["*"];
  const platform = options.platform ?? "ios";
  const primaryApp = apps[0] ?? "*";
  const spoofUserAgent = options.spoofUserAgent !== false;
  const script = buildEmulationScript({
    apps,
    platform,
    categories: options.categories,
    userAgent: spoofUserAgent,
  });

  return {
    name: "iab-emulator",
    apply: "serve",

    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        // Only spoof the UA on document navigations — not HMR, assets, or
        // websocket upgrades, which would otherwise all see the IAB UA.
        if (spoofUserAgent && req.headers.accept?.includes("text/html")) {
          req.headers["user-agent"] = getUserAgent(primaryApp, platform);
        }
        next();
      });
    },

    transformIndexHtml(html) {
      return html.replace("<head>", `<head>${htmlScriptTag(script)}`);
    },
  };
}
