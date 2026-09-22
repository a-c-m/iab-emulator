import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectIAB,
  getCapabilities,
  hasMetaIABBridge,
  isMetaIAB,
  supportsPopups,
} from "../src/detect/index.js";
import { getUserAgent } from "../src/emulation/user-agents.js";

function setBridge(): void {
  (window as unknown as Record<string, unknown>).iabjs = {};
}
function clearBridge(): void {
  Reflect.deleteProperty(window as unknown as Record<string, unknown>, "iabjs");
}

const CHROME_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1";

describe("detectIAB", () => {
  it("identifies Instagram", () => {
    expect(detectIAB(getUserAgent("meta-ig", "ios"))).toEqual({
      isIAB: true,
      app: "meta-ig",
    });
  });

  it("identifies Facebook from FBAN/FBAV tokens", () => {
    expect(detectIAB(getUserAgent("meta-fb", "ios")).app).toBe("meta-fb");
  });

  it("identifies TikTok on both platforms", () => {
    expect(detectIAB(getUserAgent("tiktok", "ios")).app).toBe("tiktok");
    expect(detectIAB(getUserAgent("tiktok", "android")).app).toBe("tiktok");
  });

  it("returns not-an-IAB for a real mobile browser", () => {
    expect(detectIAB(CHROME_IOS)).toEqual({ isIAB: false, app: null });
  });

  it("returns not-an-IAB for empty and desktop user-agents", () => {
    expect(detectIAB("")).toEqual({ isIAB: false, app: null });
    expect(
      detectIAB(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
      ).isIAB
    ).toBe(false);
  });

  it("resolves a UA matching multiple apps by manifest order (meta-fb wins)", () => {
    // Some Meta surfaces carry both Instagram and FBAV tokens; meta-fb is the
    // first pattern, so detection is deterministic.
    const ua = "Mozilla/5.0 Instagram 333.0 FBAV/465.0 Mobile";
    expect(detectIAB(ua).app).toBe("meta-fb");
  });
});

describe("hasMetaIABBridge and UA-independent fallback", () => {
  afterEach(clearBridge);

  it("hasMetaIABBridge reflects the presence of an injected bridge global", () => {
    expect(hasMetaIABBridge()).toBe(false);
    setBridge();
    expect(hasMetaIABBridge()).toBe(true);
  });

  it("detectIAB() with no argument falls back to the bridge when the UA is not an IAB", () => {
    setBridge();
    expect(detectIAB()).toEqual({ isIAB: true, app: "meta-fb" });
  });

  it("detectIAB(ua) with an explicit UA ignores the bridge (pure UA mode)", () => {
    setBridge();
    expect(detectIAB(CHROME_IOS)).toEqual({ isIAB: false, app: null });
  });
});

describe("isMetaIAB", () => {
  it("is true for Facebook and Instagram, false otherwise", () => {
    expect(isMetaIAB(getUserAgent("meta-fb", "android"))).toBe(true);
    expect(isMetaIAB(getUserAgent("meta-ig", "ios"))).toBe(true);
    expect(isMetaIAB(getUserAgent("tiktok", "ios"))).toBe(false);
    expect(isMetaIAB(CHROME_IOS)).toBe(false);
  });
});

describe("getCapabilities", () => {
  it("reports a capability snapshot with popups left unprobed", () => {
    const caps = getCapabilities();
    expect(caps.supportsPopups).toBeNull();
    expect(typeof caps.hasServiceWorker).toBe("boolean");
    expect(typeof caps.hasPaymentRequest).toBe("boolean");
    expect(typeof caps.isIAB).toBe("boolean");
  });
});

describe("supportsPopups", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is false when window.open returns null (popup blocked)", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(supportsPopups()).toBe(false);
  });

  it("is true and closes the probe when window.open returns a usable handle", () => {
    const close = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      closed: false,
      close,
    } as unknown as Window);
    expect(supportsPopups()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("is false when window.open throws", () => {
    vi.spyOn(window, "open").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(supportsPopups()).toBe(false);
  });
});
