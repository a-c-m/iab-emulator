import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getRestriction } from "../src/restrictions/index.js";

function freshWindow(body = ""): Window {
  const dom = new JSDOM(`<!doctype html><body>${body}</body>`, {
    url: "https://example.com/",
  });
  return dom.window as unknown as Window;
}

function apply(win: Window, id: string): void {
  const restriction = getRestriction(id);
  if (!restriction) {
    throw new Error(`unknown restriction: ${id}`);
  }
  restriction.emulate(win);
}

function define(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("navigation", () => {
  it("window-open-blocked returns null for any URL (cross- and same-origin) and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    const realOpen = vi.fn(() => ({}) as Window);
    win.open = realOpen as unknown as Window["open"];

    apply(win, "window-open-blocked");

    expect(win.open("https://other.example.org/x")).toBeNull();
    expect(win.open("https://example.com/checkout")).toBeNull();
    expect(win.open("/relative")).toBeNull();
    expect(realOpen).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("window-opener-null pins opener to null", () => {
    const win = freshWindow();
    apply(win, "window-opener-null");

    // The override makes opener a getter-only property: assignment is rejected
    // (it throws under strict mode), and the value stays null regardless.
    try {
      (win as unknown as { opener: unknown }).opener = { postMessage: () => undefined };
    } catch {
      // expected in strict mode — opener is no longer writable
    }

    expect(win.opener).toBeNull();
  });

  it("target-blank-suppressed prevents the default click", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow('<a id="t" target="_blank" href="https://example.org/x">link</a>');
    apply(win, "target-blank-suppressed");

    const anchor = win.document.getElementById("t");
    if (!anchor) {
      throw new Error("anchor missing");
    }
    const EventCtor = (win as unknown as { Event: typeof Event }).Event;
    const event = new EventCtor("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("target-blank-suppressed leaves a normal (non-_blank) anchor alone", () => {
    const win = freshWindow('<a id="t" href="https://example.org/x">link</a>');
    apply(win, "target-blank-suppressed");

    const anchor = win.document.getElementById("t");
    if (!anchor) {
      throw new Error("anchor missing");
    }
    const EventCtor = (win as unknown as { Event: typeof Event }).Event;
    const event = new EventCtor("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("target-blank-suppressed ignores clicks on a non-element target", () => {
    const win = freshWindow();
    apply(win, "target-blank-suppressed");

    const EventCtor = (win as unknown as { Event: typeof Event }).Event;
    const event = new EventCtor("click", { bubbles: true, cancelable: true });
    expect(() => win.document.dispatchEvent(event)).not.toThrow();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("payments", () => {
  it("payment-request-unavailable removes window.PaymentRequest", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win, "PaymentRequest", class {});

    apply(win, "payment-request-unavailable");

    expect("PaymentRequest" in win).toBe(false);
  });

  it("apple-pay-session-unavailable removes window.ApplePaySession", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win, "ApplePaySession", class {});

    apply(win, "apple-pay-session-unavailable");

    expect("ApplePaySession" in win).toBe(false);
  });
});

describe("storage", () => {
  it("storage-access-denied rejects requestStorageAccess", async () => {
    const win = freshWindow();
    apply(win, "storage-access-denied");

    await expect(win.document.requestStorageAccess()).rejects.toThrow("Storage Access API denied");
  });

  it("seven-day cap is a documented no-op that never throws", () => {
    const win = freshWindow();
    expect(() => apply(win, "seven-day-script-writable-storage-cap")).not.toThrow();
  });
});

describe("api", () => {
  it("service-worker-unavailable removes navigator.serviceWorker", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win.navigator, "serviceWorker", {});

    apply(win, "service-worker-unavailable");

    expect("serviceWorker" in win.navigator).toBe(false);
  });

  it("fullscreen-api-blocked rejects requestFullscreen", async () => {
    const win = freshWindow("<div id=d></div>");
    apply(win, "fullscreen-api-blocked");

    const el = win.document.getElementById("d");
    if (!el) {
      throw new Error("element missing");
    }
    await expect(el.requestFullscreen()).rejects.toThrow("Fullscreen API blocked");
  });

  it("clipboard-read-restricted rejects clipboard.readText", async () => {
    const win = freshWindow();
    define(win.navigator, "clipboard", { readText: () => Promise.resolve("x") });

    apply(win, "clipboard-read-restricted");

    await expect(win.navigator.clipboard.readText()).rejects.toThrow("clipboard.readText blocked");
  });

  it("notification-api-unavailable removes window.Notification", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win, "Notification", class {});

    apply(win, "notification-api-unavailable");

    expect("Notification" in win).toBe(false);
  });

  it("webauthn-unavailable removes window.PublicKeyCredential", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win, "PublicKeyCredential", class {});

    apply(win, "webauthn-unavailable");

    expect("PublicKeyCredential" in win).toBe(false);
  });

  it("web-share-unavailable removes navigator.share and canShare", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win.navigator, "share", () => Promise.resolve());
    define(win.navigator, "canShare", () => true);

    apply(win, "web-share-unavailable");

    expect("share" in win.navigator).toBe(false);
    expect("canShare" in win.navigator).toBe(false);
  });
});

describe("idempotency", () => {
  it("applying a restriction twice is safe and stable", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow();
    define(win, "PaymentRequest", {});

    apply(win, "payment-request-unavailable");
    apply(win, "payment-request-unavailable");

    expect("PaymentRequest" in win).toBe(false);
  });

  it("re-applying window-opener-null does not throw (non-configurable on second pass)", () => {
    const win = freshWindow();

    expect(() => {
      apply(win, "window-opener-null");
      apply(win, "window-opener-null");
    }).not.toThrow();
    expect(win.opener).toBeNull();
  });

  it("re-applying target-blank-suppressed does not double-bind the listener", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const win = freshWindow('<a id="t" target="_blank" href="https://example.org/x">link</a>');

    apply(win, "target-blank-suppressed");
    apply(win, "target-blank-suppressed");

    const anchor = win.document.getElementById("t");
    if (!anchor) {
      throw new Error("anchor missing");
    }
    const EventCtor = (win as unknown as { Event: typeof Event }).Event;
    const event = new EventCtor("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    // One listener, not two — a single warn proves the second apply was a no-op.
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("clipboard-read-restricted no-ops when navigator.clipboard is unavailable", () => {
    const win = freshWindow();
    Object.defineProperty(win.navigator, "clipboard", { value: undefined, configurable: true });

    expect(() => apply(win, "clipboard-read-restricted")).not.toThrow();
  });
});
