import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { getRestriction } from "../src/restrictions/index.js";

// The other suites seed restricted APIs as OWN data properties on the instance.
// Real browsers expose them as configurable accessors/methods on the PROTOTYPE.
// These tests mirror that placement so the prototype-vs-instance handling is
// actually exercised — the distinction that broke serviceWorker once. (WebIDL
// interface members are configurable, so a configurable redefine/delete is the
// realistic shape.)

function freshWindow(body = ""): Window {
  return new JSDOM(`<!doctype html><body>${body}</body>`, {
    url: "https://example.com/",
  }).window as unknown as Window;
}

function apply(win: Window, id: string): void {
  const restriction = getRestriction(id);
  if (!restriction) {
    throw new Error(`unknown restriction: ${id}`);
  }
  restriction.emulate(win);
}

describe("emulations defeat real-browser prototype placement", () => {
  it("service-worker: removes a configurable accessor on Navigator.prototype", () => {
    const win = freshWindow();
    const proto = Object.getPrototypeOf(win.navigator) as object;
    Object.defineProperty(proto, "serviceWorker", { configurable: true, get: () => ({}) });

    apply(win, "service-worker-unavailable");

    expect("serviceWorker" in win.navigator).toBe(false);
  });

  it("payment-request: removes a configurable value on window", () => {
    const win = freshWindow();
    Object.defineProperty(win, "PaymentRequest", { configurable: true, value: {} });

    apply(win, "payment-request-unavailable");

    expect("PaymentRequest" in win).toBe(false);
  });

  it("clipboard: shadows readText inherited from the Clipboard prototype", async () => {
    const win = freshWindow();
    const clipProto = { readText: () => Promise.resolve("x") };
    Object.defineProperty(win.navigator, "clipboard", {
      configurable: true,
      value: Object.create(clipProto),
    });

    apply(win, "clipboard-read-restricted");

    await expect(win.navigator.clipboard.readText()).rejects.toThrow("clipboard.readText blocked");
  });

  it("fullscreen: redefines a configurable method on Element.prototype", async () => {
    const win = freshWindow("<div id=d></div>");
    const elementCtor = (win as unknown as { Element: typeof Element }).Element;
    Object.defineProperty(elementCtor.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: () => Promise.resolve(),
    });

    apply(win, "fullscreen-api-blocked");

    const el = win.document.getElementById("d");
    if (!el) {
      throw new Error("element missing");
    }
    await expect(el.requestFullscreen()).rejects.toThrow("Fullscreen API blocked");
  });

  it("storage-access: shadows requestStorageAccess on the document", async () => {
    const win = freshWindow();
    const docProto = Object.getPrototypeOf(win.document) as object;
    Object.defineProperty(docProto, "requestStorageAccess", {
      configurable: true,
      writable: true,
      value: () => Promise.resolve(),
    });

    apply(win, "storage-access-denied");

    await expect(win.document.requestStorageAccess()).rejects.toThrow("Storage Access API denied");
  });
});
