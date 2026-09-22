import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { buildChromeOverlay } from "../src/emulation/chrome-overlay.js";

function render(overlay: string, body = "<h1>app</h1>"): JSDOM {
  return new JSDOM(`<!doctype html><html><head></head><body>${body}${overlay}</body></html>`, {
    runScripts: "dangerously",
    url: "https://shop.example.com/checkout",
  });
}

describe("buildChromeOverlay", () => {
  it("labels the header for the given app", () => {
    expect(buildChromeOverlay("meta-fb")).toContain("Facebook");
    expect(buildChromeOverlay("meta-ig")).toContain("Instagram");
    expect(buildChromeOverlay("tiktok")).toContain("TikTok");
    expect(buildChromeOverlay("*")).toContain("In-App Browser");
  });

  it("closes its script tag exactly once (no premature </script inside the body)", () => {
    // The overlay is raw HTML with its own <script> element, so it contains one
    // real closing tag — and only one, or its inline script would be truncated.
    expect(buildChromeOverlay("meta-ig").toLowerCase().split("</script")).toHaveLength(2);
  });

  it("mounts, shows the host, and pads the body so content clears the bars", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const doc = render(buildChromeOverlay("meta-fb")).window.document;
    expect(doc.getElementById("iab-emulator-chrome")).not.toBeNull();
    expect(doc.getElementById("iab-host")?.textContent).toBe("shop.example.com");
    // Padding is applied (value is layout-dependent; jsdom reports 0px, but the
    // code path ran and set it — a real browser gets the bar heights).
    expect(doc.body.style.paddingTop).not.toBe("");
    expect(doc.body.style.paddingBottom).not.toBe("");
  });

  it("'open in browser' routes through window.open (so it fails like a real IAB)", () => {
    const dom = render(buildChromeOverlay("meta-ig"));
    const openSpy = vi.spyOn(dom.window, "open").mockReturnValue(null);
    const warn = vi.spyOn(dom.window.console, "warn").mockImplementation(() => undefined);

    const btn = dom.window.document.querySelector('[data-iab-act="open"]') as HTMLElement | null;
    if (!btn) {
      throw new Error("open button missing");
    }
    btn.click();

    expect(openSpy).toHaveBeenCalledWith("https://shop.example.com/checkout", "_blank");
    expect(warn).toHaveBeenCalled();
  });
});
