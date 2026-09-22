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

  {
    id: "notification-api-unavailable",
    category: "api",
    description:
      "window.Notification is absent, so Web Notifications feature-detection fails and permission can never be requested.",
    breaks: [
      "Web push opt-in prompts gated on `window.Notification`",
      "Libraries that feature-detect `Notification` before registering push",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "FBAV 578–579 (iOS 26.6.2 / Android 14)",
    confirmedDate: "2026-09",
    ref: "https://developer.mozilla.org/en-US/docs/Web/API/Notification",
    refAlt: "https://caniwebview.com/features/api-notifications/",
    emulate(win) {
      // Notification is a constructor exposed on the global. Engines differ on
      // whether it sits on the instance or the prototype, so delete from both —
      // that is what makes `"Notification" in window` false, as in a real IAB.
      const proto = Object.getPrototypeOf(win) as object | null;
      if (proto) {
        Reflect.deleteProperty(proto, "Notification");
      }
      Reflect.deleteProperty(win, "Notification");
      console.warn(
        "[iab-emulator] window.Notification removed (Web Notifications unavailable in in-app browsers)"
      );
    },
  },

  {
    id: "webauthn-unavailable",
    category: "api",
    description:
      "window.PublicKeyCredential is absent, so WebAuthn / passkey feature-detection fails and passkey sign-in cannot start.",
    breaks: [
      "Passkey / WebAuthn sign-in gated on `window.PublicKeyCredential`",
      "`isUserVerifyingPlatformAuthenticatorAvailable()` capability checks",
    ],
    platforms: ["android"],
    apps: ["*"],
    confirmedVersion: "FB4A 578 / Android 14",
    confirmedDate: "2026-09",
    ref: "https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential",
    refAlt: "https://caniwebview.com/features/api-webauthn/",
    emulate(win) {
      // PublicKeyCredential is a constructor on the global; engines differ on
      // instance vs prototype placement, so delete from both.
      const proto = Object.getPrototypeOf(win) as object | null;
      if (proto) {
        Reflect.deleteProperty(proto, "PublicKeyCredential");
      }
      Reflect.deleteProperty(win, "PublicKeyCredential");
      console.warn(
        "[iab-emulator] window.PublicKeyCredential removed (WebAuthn/passkeys unavailable in in-app browsers)"
      );
    },
  },

  {
    id: "web-share-unavailable",
    category: "api",
    description:
      "navigator.share is absent, so the Web Share API is unavailable and share buttons that feature-detect it fall through.",
    breaks: [
      "Native share-sheet buttons gated on `navigator.share`",
      "`navigator.canShare()` capability checks",
    ],
    platforms: ["android"],
    apps: ["*"],
    confirmedVersion: "FB4A 578 / Android 14",
    confirmedDate: "2026-09",
    ref: "https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share",
    refAlt: "https://caniwebview.com/features/api-web-share/",
    emulate(win) {
      // share/canShare are methods on Navigator.prototype; remove both from the
      // prototype and any own shadow so feature-detection sees them absent.
      const nav = win.navigator;
      const proto = Object.getPrototypeOf(nav) as object | null;
      if (proto) {
        Reflect.deleteProperty(proto, "share");
        Reflect.deleteProperty(proto, "canShare");
      }
      Reflect.deleteProperty(nav, "share");
      Reflect.deleteProperty(nav, "canShare");
      console.warn(
        "[iab-emulator] navigator.share removed (Web Share API unavailable in in-app browsers)"
      );
    },
  },
];
