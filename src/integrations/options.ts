import type { BuildEmulationOptions } from "../emulation/build-script.js";
import type { AppId } from "../restrictions/schema.js";

export interface IabIntegrationOptions extends BuildEmulationOptions {
  /**
   * Render a fake in-app-browser chrome (phone status bar + app header + bottom
   * toolbar) over the page, so a manual tester SEES they are "in" the IAB while
   * the restrictions are active. `true` uses the primary app (`apps[0]`); pass an
   * app id to force a specific look. Presentation only — it applies no
   * restrictions. Default: off.
   */
  chrome?: boolean | AppId | undefined;

  /** Force on/off. Defaults to env-driven detection (see {@link resolveEnabled}). */
  enabled?: boolean | undefined;
}

interface MaybeProcess {
  argv?: readonly string[];
  env?: Record<string, string | undefined>;
}

/**
 * Default enable state for the dev/build integrations: ON unless `IAB_EMULATOR=0`
 * or a `--no-iab` CLI flag is present. Reads `process` defensively via
 * `globalThis` so the module stays import-safe in non-Node contexts.
 */
export function resolveEnabled(explicit?: boolean): boolean {
  if (typeof explicit === "boolean") {
    return explicit;
  }
  const proc = (globalThis as { process?: MaybeProcess }).process;
  const off = proc?.env?.IAB_EMULATOR === "0" || (proc?.argv ?? []).includes("--no-iab");
  return !off;
}

// Any "</script" in the emulation script (a restriction id or body) would close
// an inline <script> tag early. Escape it before HTML embedding (Vite/webpack).
const SCRIPT_CLOSE_TAG = /<\/script/gi;

/** Wrap the emulation script in a `<script data-iab-emulator>` tag, `</script>`-safe. */
export function htmlScriptTag(script: string): string {
  const safe = script.replace(SCRIPT_CLOSE_TAG, "<\\/script");
  return `<script data-iab-emulator>${safe}</script>`;
}
