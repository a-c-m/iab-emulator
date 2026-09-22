/**
 * Runtime in-app-browser detection. ZERO runtime dependencies and no Node
 * APIs — safe to import directly in browser bundles (landing pages, checkout).
 * Tree-shakes cleanly. The `AppId` import is type-only, so it is erased and
 * adds no runtime coupling to the manifest.
 */

import type { AppId } from "../restrictions/schema.js";

// Order is load-bearing: detectIAB returns the FIRST match. meta-fb is listed
// before meta-ig so a UA carrying both tokens resolves to Facebook.
const APP_PATTERNS: Record<AppId, RegExp> = {
  "meta-fb": /FBAN|FBAV|FB_IAB|FB4A/i,
  "meta-ig": /Instagram/i,
  tiktok: /musical_ly|TikTok|trill/i,
  linkedin: /LinkedInApp/i,
  snapchat: /Snapchat/i,
  pinterest: /Pinterest/i,
};

export interface IabDetection {
  app: AppId | null;
  isIAB: boolean;
}

export interface IabCapabilities extends IabDetection {
  hasClipboard: boolean;
  hasPaymentRequest: boolean;
  hasServiceWorker: boolean;
  hasShareAPI: boolean;
  /** `null` until {@link supportsPopups} is called inside a user gesture. */
  supportsPopups: boolean | null;
}

function currentUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

/**
 * Non-standard globals the Meta (Facebook/Instagram) in-app browser injects
 * into the page. Presence is a user-agent-independent signal — in-app browsers
 * sometimes strip or normalise their UA, but the injected JS bridge remains.
 * Observed on FB4A (Android 14, FBAV 578); the exact set evolves across app
 * builds, so any single match is treated as "Meta in-app browser".
 */
const META_BRIDGE_GLOBALS = [
  "fbpayIAWBridge",
  "iabjs",
  "iabjs_unified_bridge",
  "__call_iabjs_unified_bridge",
];

/**
 * True if a Meta (FB/IG) in-app-browser JS bridge is present on `window`. A
 * user-agent-independent detection signal; safe to call anywhere (returns
 * `false` when there is no `window`).
 */
export function hasMetaIABBridge(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const scope = window as unknown as Record<string, unknown>;
  return META_BRIDGE_GLOBALS.some((name) => name in scope);
}

/**
 * Detect whether `ua` is a known in-app browser, and which app. Called with no
 * argument it also falls back to {@link hasMetaIABBridge} for the live page, so
 * a Meta in-app browser is still caught when its UA has been stripped. Pass an
 * explicit `ua` (e.g. a server request header) for pure UA-only detection.
 */
export function detectIAB(ua?: string): IabDetection {
  const agent = ua ?? currentUserAgent();
  for (const app of Object.keys(APP_PATTERNS) as AppId[]) {
    if (APP_PATTERNS[app].test(agent)) {
      return { isIAB: true, app };
    }
  }
  if (ua === undefined && hasMetaIABBridge()) {
    return { isIAB: true, app: "meta-fb" };
  }
  return { isIAB: false, app: null };
}

/** True if `ua` is the Facebook or Instagram in-app browser. */
export function isMetaIAB(ua: string = currentUserAgent()): boolean {
  return APP_PATTERNS["meta-fb"].test(ua) || APP_PATTERNS["meta-ig"].test(ua);
}

/**
 * Probe whether real popups work. MUST be called inside a user gesture (e.g. a
 * click handler) — calling it on load trips the browser's own popup blocker
 * and returns a false negative.
 */
export function supportsPopups(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const probe = window.open("", "_blank", "width=1,height=1,left=-9999,top=-9999");
    if (!probe || probe.closed || typeof probe.closed === "undefined") {
      return false;
    }
    probe.close();
    return true;
  } catch {
    return false;
  }
}

/** A snapshot of IAB-relevant capabilities for the current environment. */
export function getCapabilities(): IabCapabilities {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";
  return {
    ...detectIAB(),
    // Call supportsPopups() inside a user gesture to populate this.
    supportsPopups: null,
    hasPaymentRequest: hasWindow && "PaymentRequest" in window,
    hasServiceWorker: hasNavigator && "serviceWorker" in navigator,
    hasClipboard: hasNavigator && "clipboard" in navigator,
    hasShareAPI: hasNavigator && "share" in navigator,
  };
}
