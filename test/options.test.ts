import { afterEach, describe, expect, it } from "vitest";
import { htmlScriptTag, resolveEnabled } from "../src/integrations/options.js";

const originalEnv = process.env.IAB_EMULATOR;
const originalArgv = process.argv;

afterEach(() => {
  if (originalEnv === undefined) {
    Reflect.deleteProperty(process.env, "IAB_EMULATOR");
  } else {
    process.env.IAB_EMULATOR = originalEnv;
  }
  process.argv = originalArgv;
});

describe("resolveEnabled", () => {
  it("honours an explicit boolean over the environment", () => {
    process.env.IAB_EMULATOR = "0";
    expect(resolveEnabled(true)).toBe(true);
    expect(resolveEnabled(false)).toBe(false);
  });

  it("is on by default", () => {
    Reflect.deleteProperty(process.env, "IAB_EMULATOR");
    process.argv = ["node", "vite"];
    expect(resolveEnabled()).toBe(true);
  });

  it("is off when IAB_EMULATOR=0", () => {
    process.env.IAB_EMULATOR = "0";
    process.argv = ["node", "vite"];
    expect(resolveEnabled()).toBe(false);
  });

  it("is off when --no-iab is present", () => {
    Reflect.deleteProperty(process.env, "IAB_EMULATOR");
    process.argv = ["node", "vite", "--no-iab"];
    expect(resolveEnabled()).toBe(false);
  });
});

describe("htmlScriptTag", () => {
  it("wraps the script in a data-iab-emulator tag", () => {
    expect(htmlScriptTag("var x=1;")).toBe("<script data-iab-emulator>var x=1;</script>");
  });

  it("escapes </script so the inline tag can't be closed early", () => {
    const out = htmlScriptTag('console.log("</script><img src=x>")');
    expect(out).not.toContain("</script><img");
    expect(out).toContain("<\\/script");
    // Exactly one real closing tag (the wrapper's): splitting yields two parts.
    expect(out.split("</script>")).toHaveLength(2);
  });
});
