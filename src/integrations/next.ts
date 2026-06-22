import type { NextConfig } from "next";
import { buildEmulationScript } from "../emulation/build-script.js";
import { getUserAgent } from "../emulation/user-agents.js";
import { type IabIntegrationOptions, resolveEnabled } from "./options.js";

/**
 * Wrap a Next.js config so the emulation script and IAB user-agent are exposed
 * as build-time env values (`__IAB_EMULATOR_SCRIPT__`, `__IAB_EMULATOR_UA__`). Wire
 * them into the page via middleware or a custom Document — see
 * docs/integrations.md (Next's injection points move between major versions, so
 * that step lives in docs rather than baked into the wrapper).
 *
 * SAFETY: `next.config` `env` values are inlined into the **client bundle**.
 * This wrapper is a no-op in production builds (`NODE_ENV === "production"`)
 * unless you explicitly pass `enabled: true`, so the dev/test emulation script
 * never ships to real users by accident.
 *
 * ```ts
 * // next.config.mjs
 * import { withIabEmulator } from "iab-emulator/next";
 * export default withIabEmulator({}, { apps: ["meta-ig"] });
 * ```
 */
export function withIabEmulator(
  nextConfig: NextConfig = {},
  options: IabIntegrationOptions = {}
): NextConfig {
  if (!resolveEnabled(options.enabled)) {
    return nextConfig;
  }

  // Never inline the emulation script into a production client bundle unless
  // explicitly forced — this is dev/test tooling.
  if (process.env.NODE_ENV === "production" && options.enabled !== true) {
    return nextConfig;
  }

  const apps = options.apps ?? ["*"];
  const platform = options.platform ?? "ios";
  const primaryApp = apps[0] ?? "*";
  const script = buildEmulationScript({
    apps,
    platform,
    categories: options.categories,
    userAgent: options.userAgent,
  });

  return {
    ...nextConfig,
    env: {
      ...nextConfig.env,
      __IAB_EMULATOR_SCRIPT__: script,
      __IAB_EMULATOR_UA__: getUserAgent(primaryApp, platform),
    },
  };
}
