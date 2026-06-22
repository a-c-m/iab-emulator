import { describe, expect, it } from "vitest";
import { getUserAgent } from "../src/emulation/user-agents.js";

describe("getUserAgent", () => {
  it("returns the app + platform specific string", () => {
    expect(getUserAgent("meta-ig", "ios")).toContain("Instagram");
    expect(getUserAgent("tiktok", "android")).toContain("musical_ly");
  });

  it("resolves the wildcard scope to the default app", () => {
    expect(getUserAgent("*", "ios")).toContain("Instagram");
  });
});
