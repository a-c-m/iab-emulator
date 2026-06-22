/**
 * The public API contract for a restriction entry. Community PRs add entries
 * conforming to this shape — keep it documented and stable.
 */

export type RestrictionCategory = "navigation" | "payments" | "storage" | "api";

export type Platform = "ios" | "android";

/**
 * Known in-app-browser hosts. Lowercase short names. Use `"*"` (see
 * {@link AppScope}) when a restriction is a WebView/WKWebView platform trait
 * rather than app-specific.
 */
export type AppId = "meta-fb" | "meta-ig" | "tiktok" | "linkedin" | "snapchat" | "pinterest";

/** An app id, or `"*"` meaning "all in-app browsers". */
export type AppScope = AppId | "*";

export interface Restriction {
  /**
   * Apps known to trigger this. Use `["*"]` when it is a platform restriction
   * common to all in-app browsers rather than app-specific.
   */
  apps: AppScope[];

  /**
   * Concrete real-world integrations or patterns this affects. Generic
   * ("OAuth popup flows") and specific ("Recurly 3DS popup") both welcome.
   */
  breaks: string[];

  category: RestrictionCategory;

  /** ISO month, `YYYY-MM`. Month precision is enough. */
  confirmedDate: string;

  /** App/OS version where confirmed, or `"unknown"`. */
  confirmedVersion: string;

  /** One sentence. What the restriction is, not what it breaks. */
  description: string;

  /**
   * Mutates `win` to emulate the restriction. This function is serialized with
   * {@link Function.prototype.toString} and injected into the page as a STRING
   * (see docs/adr/0001). Therefore it MUST:
   *
   * - be SELF-CONTAINED — reference only the `win` argument and page globals
   *   (`Object`, `Reflect`, `Promise`, `console`, …). Any reference to a
   *   module-scope identifier becomes `undefined` in the page. This is the one
   *   hard rule, and it is enforced by `test/serializable.test.ts`.
   * - be idempotent and log suppressions via `console.warn("[iab-emulator] …")`.
   *
   * Modern syntax is fine: the build targets ES2022 and does not minify, so the
   * serialized output runs as-is in any current in-app browser.
   *
   * If the restriction cannot be emulated at the JS level (e.g. the 7-day
   * storage purge), provide an empty body and explain why in a comment.
   */
  emulate: (win: Window) => void;
  /**
   * Unique kebab-case identifier. Stable reference in docs and test output.
   * Never rename once published — treat a rename as a breaking change.
   */
  id: string;

  /** Platforms that exhibit this. Many are iOS/WKWebView only. */
  platforms: Platform[];

  /** Primary reference URL (caniwebview.com, WebKit bugzilla, Apple forums…). */
  ref: string;

  /** Secondary reference, if useful. */
  refAlt?: string;
}
