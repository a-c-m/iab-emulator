import { describe, expect, it, vi } from "vitest";
import type { Compiler } from "webpack";
import { withIabEmulator } from "../src/integrations/next.js";
import { iabEmulator } from "../src/integrations/vite.js";
import { IabEmulatorWebpackPlugin } from "../src/integrations/webpack.js";

type MiddlewareHandler = (
  req: { headers: Record<string, string> },
  res: unknown,
  next: () => void
) => void;

interface TestVitePlugin {
  configureServer: (server: { middlewares: { use: (handler: MiddlewareHandler) => void } }) => void;
  name: string;
  transformIndexHtml: (html: string) => string;
}

function fakeCompiler(taps: Array<(compilation: unknown) => void>) {
  return {
    options: { plugins: [] },
    hooks: {
      compilation: {
        tap: (_n: string, cb: (c: unknown) => void) => {
          taps.push(cb);
        },
      },
    },
  } as unknown as Compiler;
}

describe("vite integration", () => {
  it("injects the emulation script into the served HTML", () => {
    const plugin = iabEmulator() as unknown as TestVitePlugin;
    expect(plugin.name).toBe("iab-emulator");
    expect(plugin.transformIndexHtml("<head></head>")).toContain("data-iab-emulator");
  });

  function captureMiddleware(plugin: TestVitePlugin): MiddlewareHandler | undefined {
    let captured: MiddlewareHandler | undefined;
    plugin.configureServer({
      middlewares: {
        use: (handler) => {
          captured = handler;
        },
      },
    });
    return captured;
  }

  it("spoofs the request user-agent on HTML navigations", () => {
    const plugin = iabEmulator({ apps: ["meta-ig"] }) as unknown as TestVitePlugin;
    const req = { headers: { accept: "text/html" } as Record<string, string> };
    captureMiddleware(plugin)?.(req, {}, () => undefined);
    expect(req.headers["user-agent"]).toContain("Instagram");
  });

  it("does not spoof the user-agent on non-HTML requests", () => {
    const plugin = iabEmulator({ apps: ["meta-ig"] }) as unknown as TestVitePlugin;
    const req = { headers: { accept: "application/javascript" } as Record<string, string> };
    captureMiddleware(plugin)?.(req, {}, () => undefined);
    expect(req.headers["user-agent"]).toBeUndefined();
  });

  it("injects a </script>-safe script tag", () => {
    const plugin = iabEmulator({ apps: ["meta-ig"] }) as unknown as TestVitePlugin;
    const html = plugin.transformIndexHtml("<head></head>");
    expect(html).toContain("data-iab-emulator");
    // One real closing tag — nothing in the body re-opened/closed it.
    expect(html.split("</script>")).toHaveLength(2);
  });

  it("is a no-op plugin when disabled", () => {
    const plugin = iabEmulator({ enabled: false }) as unknown as TestVitePlugin;
    expect(plugin.name).toBe("iab-emulator:disabled");
  });
});

describe("next integration", () => {
  it("exposes the script and UA as build-time env", () => {
    const config = withIabEmulator({}, { apps: ["meta-ig"] });
    const env = config.env as Record<string, string>;
    expect(env.__IAB_EMULATOR_SCRIPT__).toContain("function");
    expect(env.__IAB_EMULATOR_UA__).toContain("Instagram");
  });

  it("honours userAgent: false (no client UA override in the script)", () => {
    const on = withIabEmulator({}, { apps: ["meta-ig"] }).env as Record<string, string>;
    const off = withIabEmulator({}, { apps: ["meta-ig"], userAgent: false }).env as Record<
      string,
      string
    >;
    expect(on.__IAB_EMULATOR_SCRIPT__).toContain('navigator,"userAgent"');
    expect(off.__IAB_EMULATOR_SCRIPT__).not.toContain('navigator,"userAgent"');
  });

  it("returns the config untouched when disabled", () => {
    const base = { reactStrictMode: true };
    expect(withIabEmulator(base, { enabled: false })).toBe(base);
  });
});

describe("webpack integration", () => {
  it("warns when html-webpack-plugin is absent", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const taps: Array<(compilation: unknown) => void> = [];

    new IabEmulatorWebpackPlugin().apply(fakeCompiler(taps));
    for (const cb of taps) {
      cb({});
    }

    expect(warn).toHaveBeenCalled();
  });

  it("does not tap when disabled", () => {
    const taps: Array<(compilation: unknown) => void> = [];

    new IabEmulatorWebpackPlugin({ enabled: false }).apply(fakeCompiler(taps));

    expect(taps).toHaveLength(0);
  });
});
