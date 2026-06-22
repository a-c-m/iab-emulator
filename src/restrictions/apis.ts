import type { Restriction } from "./schema.js";

/** Browser-API restrictions: Service Worker, Fullscreen, Clipboard, etc. */
export const apiRestrictions: Restriction[] = [
  {
    id: "service-worker-unavailable",
    category: "api",
    description:
      "navigator.serviceWorker is absent, so PWA installs, offline caching, and push registration fail.",
    breaks: [
      "Service worker registration (offline support, push)",
      "Libraries that feature-detect `navigator.serviceWorker`",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2022-11",
    ref: "https://caniwebview.com/features/api-service-worker/",
    emulate(win) {
      // serviceWorker is a configurable accessor on Navigator.prototype, not an
      // own property of the navigator instance — deleting it from the prototype
      // is what actually makes `"serviceWorker" in navigator` false in a real
      // browser. Also clear any own shadow, belt and braces.
      const nav = win.navigator;
      const proto = Object.getPrototypeOf(nav) as object | null;
      if (proto) {
        Reflect.deleteProperty(proto, "serviceWorker");
      }
      Reflect.deleteProperty(nav, "serviceWorker");
      console.warn(
        "[iab-emulator] navigator.serviceWorker removed (unavailable in in-app browsers)"
      );
    },
  },

  {
    id: "fullscreen-api-blocked",
    category: "api",
    description:
      "Element.requestFullscreen() rejects, so any fullscreen-on-interaction flow silently fails.",
    breaks: ["Fullscreen video players", "Fullscreen image galleries / lightboxes"],
    platforms: ["ios"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2023-05",
    ref: "https://caniwebview.com/features/api-fullscreen/",
    emulate(win) {
      const elementCtor = (win as unknown as { Element?: typeof Element }).Element;
      if (elementCtor?.prototype) {
        // defineProperty (not plain assignment): requestFullscreen is a
        // prototype method that may be non-writable in some engines; a
        // configurable redefine works where `proto.x = fn` would silently fail.
        Object.defineProperty(elementCtor.prototype, "requestFullscreen", {
          configurable: true,
          writable: true,
          value: () => Promise.reject(new Error("[iab-emulator] Fullscreen API blocked")),
        });
      }
    },
  },

  {
    id: "clipboard-read-restricted",
    category: "api",
    description: "navigator.clipboard.readText() rejects, so paste-from-clipboard helpers fail.",
    breaks: ["'Paste code' / 'paste coupon' convenience buttons", "Clipboard-driven autofill"],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2023-07",
    ref: "https://caniwebview.com/features/api-clipboard/",
    emulate(win) {
      const clip = win.navigator.clipboard;
      if (clip) {
        // defineProperty over an own data property on the Clipboard instance,
        // shadowing the prototype method — robust against a non-writable
        // descriptor where `clip.readText = fn` would no-op.
        Object.defineProperty(clip, "readText", {
          configurable: true,
          writable: true,
          value: () => Promise.reject(new Error("[iab-emulator] clipboard.readText blocked")),
        });
      }
    },
  },
];
