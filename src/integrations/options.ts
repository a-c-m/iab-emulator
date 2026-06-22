import type { BuildEmulationOptions } from "../emulation/build-script.js";

export interface IabIntegrationOptions extends BuildEmulationOptions {
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
