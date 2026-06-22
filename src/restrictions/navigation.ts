import type { Restriction } from "./schema.js";

/**
 * Navigation restrictions: how in-app browsers break popups, new windows, and
 * the opener relationship. `emulate` bodies must be self-contained — they are
 * serialized to a string and injected into the page (see docs/adr/0001).
 */
export const navigationRestrictions: Restriction[] = [
  {
    id: "window-open-blocked",
    category: "navigation",
    description:
      "window.open() returns null for any URL — no popup or new window opens. Lowest-common-denominator: in-app browsers broadly break programmatic popups.",
    breaks: [
      "Recurly 3DS challenge popup",
      "PayPal checkout popup",
      "OAuth popup flows (Google, Apple, Facebook Login)",
      "Any programmatic popup or new window",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2022-08",
    ref: "https://blog.eidinger.info/how-to-handle-popups-and-alerts-in-wkwebview",
    emulate(win) {
      // defineProperty (not plain assignment): window.open may be non-writable
      // in some engines, where `win.open = fn` would silently no-op.
      Object.defineProperty(win, "open", {
        configurable: true,
        writable: true,
        value: () => {
          console.warn("[iab-emulator] window.open() suppressed (in-app browsers block popups)");
          return null;
        },
      });
    },
  },

  {
    id: "window-opener-null",
    category: "navigation",
    description:
      "window.opener is always null in any window opened by the IAB, breaking postMessage-based callback patterns.",
    breaks: [
      "Recurly 3DS token postMessage callback",
      "OAuth flows using opener.postMessage to return tokens",
    ],
    platforms: ["ios"],
    apps: ["meta-fb", "meta-ig"],
    confirmedVersion: "iOS 17.5+",
    confirmedDate: "2024-06",
    ref: "https://developer.apple.com/forums/thread/810417",
    refAlt: "https://developer.apple.com/forums/thread/759487",
    emulate(win) {
      try {
        // Intentionally configurable:false (unlike the other emulations): once
        // opener is pinned to null it must not be redefinable, mirroring the
        // real IAB. A second application hits the catch below — that's fine.
        Object.defineProperty(win, "opener", {
          get() {
            return null;
          },
          configurable: false,
        });
      } catch {
        // Already non-configurable (e.g. re-applied) — nothing to do.
      }
    },
  },

  {
    id: "target-blank-suppressed",
    category: "navigation",
    description:
      '<a target="_blank"> clicks are silently suppressed. No new tab or window is opened.',
    breaks: [
      "T&Cs links opening in a new tab",
      "External auth providers opened via an anchor tag",
      "Any UX pattern that relies on a second window",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2022-08",
    ref: "https://blog.eidinger.info/how-to-handle-popups-and-alerts-in-wkwebview",
    emulate(win) {
      // Idempotent: a marker on window prevents a duplicate capture-phase
      // listener (and duplicate preventDefault/warn) if applied more than once.
      const marker = win as unknown as Record<string, boolean>;
      if (marker.__iabEmulatorTargetBlankBound) {
        return;
      }
      marker.__iabEmulatorTargetBlankBound = true;
      win.document.addEventListener(
        "click",
        (e) => {
          const target = e.target as Element | null;
          if (!(target && typeof target.closest === "function")) {
            return;
          }
          const anchor = target.closest('a[target="_blank"]') as HTMLAnchorElement | null;
          if (anchor) {
            e.preventDefault();
            console.warn('[iab-emulator] <a target="_blank"> suppressed:', anchor.href);
          }
        },
        true
      );
    },
  },
];
