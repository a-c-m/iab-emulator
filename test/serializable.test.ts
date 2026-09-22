import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { normalizeEmulateSource, serializeEmulate } from "../src/emulation/build-script.js";
import { allRestrictions, getRestriction } from "../src/restrictions/index.js";

function freshWindow(body = ""): Window {
  return new JSDOM(`<!doctype html><body>${body}</body>`, {
    url: "https://example.com/",
  }).window as unknown as Window;
}

function define(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
}

// Reconstruct an emulate detached from module scope, exactly as real injection
// does: the Function constructor has NO closure access, so a reference to any
// module-level identifier throws ReferenceError here.
function runDetached(win: Window, id: string): void {
  const restriction = getRestriction(id);
  if (!restriction) {
    throw new Error(`unknown restriction: ${id}`);
  }
  const source = normalizeEmulateSource(restriction.emulate.toString());
  const run = new Function("window", `"use strict";(${source})(window);`);
  run(win);
}

describe("emulate functions are self-contained (serializable)", () => {
  it.each(allRestrictions)("$id runs when detached from module scope", (restriction) => {
    const win = freshWindow();
    expect(() => runDetached(win, restriction.id)).not.toThrow();
  });

  // Embed-path invariant: the script is injected inside <script>…</script> by
  // the Vite/webpack integrations. No serialized body may contain "</script",
  // which would close the tag early — regardless of who adds a restriction.
  it.each(allRestrictions)("$id serializes without a </script sequence", (restriction) => {
    expect(serializeEmulate(restriction).toLowerCase()).not.toContain("</script");
  });
});

// Per-restriction observable effect, verified through the SERIALIZED path. This
// is the real safety net: a body that silently no-ops (e.g. mutating the wrong
// target) passes the "doesn't throw" guard but fails here.
interface Effect {
  assert: (win: Window) => void | Promise<void>;
  body?: string;
  id: string;
  setup?: (win: Window) => void;
}

// Restrictions that intentionally have no observable JS-level effect.
const NO_OP_IDS = new Set(["seven-day-script-writable-storage-cap"]);

const EFFECTS: Effect[] = [
  {
    id: "window-open-blocked",
    assert: (win) => {
      expect(win.open("https://other.example.org/x")).toBeNull();
      expect(win.open("/local")).toBeNull();
    },
  },
  {
    id: "window-opener-null",
    assert: (win) => {
      const descriptor = Object.getOwnPropertyDescriptor(win, "opener");
      expect(descriptor?.get).toBeTypeOf("function");
      expect(descriptor?.configurable).toBe(false);
      expect(win.opener).toBeNull();
    },
  },
  {
    id: "target-blank-suppressed",
    body: '<a id="t" target="_blank" href="https://example.org/x">link</a>',
    assert: (win) => {
      const anchor = win.document.getElementById("t");
      if (!anchor) {
        throw new Error("anchor missing");
      }
      const EventCtor = (win as unknown as { Event: typeof Event }).Event;
      const event = new EventCtor("click", { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    },
  },
  {
    id: "payment-request-unavailable",
    setup: (win) => define(win, "PaymentRequest", {}),
    assert: (win) => {
      expect("PaymentRequest" in win).toBe(false);
    },
  },
  {
    id: "apple-pay-session-unavailable",
    setup: (win) => define(win, "ApplePaySession", {}),
    assert: (win) => {
      expect("ApplePaySession" in win).toBe(false);
    },
  },
  {
    id: "storage-access-denied",
    assert: async (win) => {
      await expect(win.document.requestStorageAccess()).rejects.toThrow(
        "Storage Access API denied"
      );
    },
  },
  {
    id: "service-worker-unavailable",
    setup: (win) => define(win.navigator, "serviceWorker", {}),
    assert: (win) => {
      expect("serviceWorker" in win.navigator).toBe(false);
    },
  },
  {
    id: "fullscreen-api-blocked",
    body: '<div id="d"></div>',
    assert: async (win) => {
      const el = win.document.getElementById("d");
      if (!el) {
        throw new Error("element missing");
      }
      await expect(el.requestFullscreen()).rejects.toThrow("Fullscreen API blocked");
    },
  },
  {
    id: "clipboard-read-restricted",
    setup: (win) => define(win.navigator, "clipboard", { readText: () => Promise.resolve("x") }),
    assert: async (win) => {
      await expect(win.navigator.clipboard.readText()).rejects.toThrow(
        "clipboard.readText blocked"
      );
    },
  },
  {
    id: "notification-api-unavailable",
    setup: (win) => define(win, "Notification", class {}),
    assert: (win) => {
      expect("Notification" in win).toBe(false);
    },
  },
  {
    id: "webauthn-unavailable",
    setup: (win) => define(win, "PublicKeyCredential", class {}),
    assert: (win) => {
      expect("PublicKeyCredential" in win).toBe(false);
    },
  },
  {
    id: "web-share-unavailable",
    setup: (win) => define(win.navigator, "share", () => Promise.resolve()),
    assert: (win) => {
      expect("share" in win.navigator).toBe(false);
    },
  },
];

describe("each emulate still produces its effect after serialization", () => {
  it.each(EFFECTS)("$id", async ({ id, body, setup, assert }) => {
    const win = freshWindow(body);
    setup?.(win);
    runDetached(win, id);
    await assert(win);
  });

  it("every restriction has an effect assertion or is an explicit no-op", () => {
    const covered = new Set(EFFECTS.map((e) => e.id));
    const missing = allRestrictions
      .map((r) => r.id)
      .filter((id) => !(covered.has(id) || NO_OP_IDS.has(id)));
    expect(missing).toEqual([]);
  });
});
