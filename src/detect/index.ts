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

/** Detect whether `ua` is a known in-app browser, and which app. */
export function detectIAB(ua: string = currentUserAgent()): IabDetection {
  for (const app of Object.keys(APP_PATTERNS) as AppId[]) {
    if (APP_PATTERNS[app].test(ua)) {
      return { isIAB: true, app };
    }
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
