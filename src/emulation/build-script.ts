import { allRestrictions } from "../restrictions/index.js";
import type {
  AppScope,
  Platform,
  Restriction,
  RestrictionCategory,
} from "../restrictions/schema.js";
import { getUserAgent } from "./user-agents.js";

export interface BuildEmulationOptions {
  /**
   * Apps to emulate. `["*"]` matches every restriction. Default: all. When
   * multiple apps are given, the restriction sets are unioned but the spoofed
   * user-agent is the FIRST app's only (`apps[0]`) — put the app whose UA you
   * want to present first.
   */
  apps?: AppScope[] | undefined;
  /** Restriction categories to include. Default: all. */
  categories?: RestrictionCategory[] | undefined;
  /** Platform to emulate. Default: `"ios"` (the more-restricted WKWebView). */
  platform?: Platform | undefined;
  /**
   * Override the page's `navigator.userAgent` to the IAB string, so client-side
   * UA detection (`iab-emulator/detect`, your own sniffing) sees the in-app
   * browser. Default `true`. This is the CLIENT-side spoof; the Vite and
   * Playwright integrations additionally spoof the request user-agent for
   * server-side sniffing. (The Next wrapper only exposes the UA as an env value
   * — see docs/integrations.md.)
   */
  userAgent?: boolean | undefined;
}

const ALL_CATEGORIES: RestrictionCategory[] = ["navigation", "payments", "storage", "api"];

/** True when a serialized emulate is already a callable expression (function/arrow). */
const ALREADY_CALLABLE = /^(function\b|\()/;

/**
 * Normalize a serialized emulate (`Function.prototype.toString()`) to a callable
 * expression. Method-shorthand needs a `function` prefix; function-expression
 * and arrow forms pass through.
 * e.g. `"emulate(win){…}"` -> `"function emulate(win){…}"`.
 */
export function normalizeEmulateSource(source: string): string {
  return ALREADY_CALLABLE.test(source) ? source : `function ${source}`;
}

function matches(
  restriction: Restriction,
  apps: AppScope[],
  platform: Platform,
  categories: RestrictionCategory[]
): boolean {
  if (!categories.includes(restriction.category)) {
    return false;
  }
  if (!restriction.platforms.includes(platform)) {
    return false;
  }
  if (restriction.apps.includes("*") || apps.includes("*")) {
    return true;
  }
  return apps.some((a) => restriction.apps.includes(a));
}

/** The restrictions selected by `options`, in manifest order. */
export function selectRestrictions(options: BuildEmulationOptions = {}): Restriction[] {
  const apps = options.apps ?? ["*"];
  const platform = options.platform ?? "ios";
  const categories = options.categories ?? ALL_CATEGORIES;
  return allRestrictions.filter((r) => matches(r, apps, platform, categories));
}

/**
 * Serialize one restriction's `emulate` into a self-invoking, fault-isolated
 * statement. Method-shorthand (`emulate(win){…}`), function-expression, and
 * arrow forms are all normalized to a callable expression.
 */
export function serializeEmulate(restriction: Restriction): string {
  const expression = normalizeEmulateSource(restriction.emulate.toString().trim());
  // JSON.stringify the id so a `"`, backslash, or `</script` in a future id
  // can't break out of the string literal (or the embedding <script> tag).
  const label = JSON.stringify(`[iab-emulator] emulate failed for ${restriction.id}:`);
  return `try{(${expression})(window);}catch(e){console.warn(${label},e);}`;
}

/**
 * A self-contained statement that overrides `navigator.userAgent` to `ua`.
 * Defines an own getter on the navigator instance (shadowing the prototype
 * accessor) so it works regardless of the original descriptor's writability.
 */
function userAgentOverride(ua: string): string {
  const json = JSON.stringify(ua);
  return `try{Object.defineProperty(navigator,"userAgent",{configurable:true,get:function(){return ${json};}});}catch(e){console.warn("[iab-emulator] navigator.userAgent override failed:",e);}`;
}

/**
 * Build the injectable emulation script — an IIFE that (optionally) overrides
 * `navigator.userAgent` and applies every selected restriction's `emulate` to
 * the page's `window`. Inject via a Vite `transformIndexHtml`, a Playwright
 * `addInitScript`, etc.
 */
export function buildEmulationScript(options: BuildEmulationOptions = {}): string {
  const apps = options.apps ?? ["*"];
  const platform = options.platform ?? "ios";
  const bodies = selectRestrictions(options).map(serializeEmulate).join("\n");
  const prelude =
    options.userAgent === false
      ? ""
      : `${userAgentOverride(getUserAgent(apps[0] ?? "*", platform))}\n`;
  return `(function(){\n${prelude}${bodies}\n})();`;
}
