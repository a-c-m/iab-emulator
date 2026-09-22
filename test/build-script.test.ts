import { describe, expect, it } from "vitest";
import {
  buildEmulationScript,
  normalizeEmulateSource,
  selectRestrictions,
  serializeEmulate,
} from "../src/emulation/build-script.js";
import { allRestrictions, getRestriction } from "../src/restrictions/index.js";

describe("normalizeEmulateSource", () => {
  it("prefixes method-shorthand with function", () => {
    expect(normalizeEmulateSource("emulate(win){}")).toBe("function emulate(win){}");
  });

  it("passes through function expressions", () => {
    expect(normalizeEmulateSource("function (w){}")).toBe("function (w){}");
  });

  it("passes through arrow functions", () => {
    expect(normalizeEmulateSource("(w) => {}")).toBe("(w) => {}");
  });
});

describe("selectRestrictions", () => {
  it("returns exactly the ios-applicable restrictions by default (all apps, all categories)", () => {
    const iosApplicable = allRestrictions.filter((r) => r.platforms.includes("ios"));
    expect(selectRestrictions()).toHaveLength(iosApplicable.length);
    // Sanity: the manifest carries android-only entries, so the ios default is
    // a strict subset — never the whole manifest.
    expect(iosApplicable.length).toBeLessThan(allRestrictions.length);
  });

  it("filters out ios-only restrictions on android", () => {
    const android = selectRestrictions({ platform: "android" });
    const ids = android.map((r) => r.id);
    expect(ids).not.toContain("apple-pay-session-unavailable");
    expect(ids).toContain("window-open-blocked");
  });

  it("includes android-only restrictions on android but not on ios", () => {
    const androidIds = selectRestrictions({ platform: "android" }).map((r) => r.id);
    const iosIds = selectRestrictions({ platform: "ios" }).map((r) => r.id);
    expect(androidIds).toContain("webauthn-unavailable");
    expect(androidIds).toContain("web-share-unavailable");
    expect(iosIds).not.toContain("webauthn-unavailable");
    expect(iosIds).not.toContain("web-share-unavailable");
  });

  it("filters by category", () => {
    const nav = selectRestrictions({ categories: ["navigation"] });
    expect(nav.every((r) => r.category === "navigation")).toBe(true);
    expect(nav.length).toBeGreaterThan(0);
  });

  it("excludes meta-only restrictions when another app is requested", () => {
    const ids = selectRestrictions({ apps: ["tiktok"] }).map((r) => r.id);
    expect(ids).not.toContain("window-opener-null");
  });

  it("includes a meta-scoped restriction for a matching app", () => {
    const ids = selectRestrictions({ apps: ["meta-fb"] }).map((r) => r.id);
    expect(ids).toContain("window-opener-null");
  });

  it("returns only wildcard restrictions for an empty apps list", () => {
    const ids = selectRestrictions({ apps: [] }).map((r) => r.id);
    expect(ids).not.toContain("window-opener-null");
    expect(ids).toContain("window-open-blocked");
  });
});

describe("serializeEmulate", () => {
  it("normalizes a method-shorthand emulate into a callable, fault-isolated stmt", () => {
    const restriction = getRestriction("window-opener-null");
    if (!restriction) {
      throw new Error("fixture missing");
    }
    const out = serializeEmulate(restriction);
    expect(out.startsWith("try{(function")).toBe(true);
    expect(out).toContain("(window);");
    expect(out).toContain("window-opener-null");
  });
});

describe("buildEmulationScript", () => {
  it("wraps the selected restrictions in a single IIFE", () => {
    const script = buildEmulationScript({ categories: ["payments"] });
    expect(script.startsWith("(function(){")).toBe(true);
    expect(script.trimEnd().endsWith("})();")).toBe(true);
    expect(script).toContain("PaymentRequest");
  });

  it("produces syntactically valid JavaScript", () => {
    const script = buildEmulationScript();
    // Throws at construction time if the assembled script is not parseable.
    expect(() => new Function(script)).not.toThrow();
  });

  it("overrides navigator.userAgent to the IAB string by default", () => {
    const script = buildEmulationScript({ apps: ["meta-ig"], platform: "ios" });
    expect(script).toContain('Object.defineProperty(navigator,"userAgent"');
    expect(script).toContain("Instagram");
  });

  it("omits the userAgent override when userAgent is false", () => {
    const script = buildEmulationScript({ apps: ["meta-ig"], userAgent: false });
    expect(script).not.toContain('navigator,"userAgent"');
  });

  it("is body-empty (still valid) when nothing matches", () => {
    const script = buildEmulationScript({ categories: [], userAgent: false });
    expect(script).toBe("(function(){\n\n})();");
    expect(() => new Function(script)).not.toThrow();
  });
});
