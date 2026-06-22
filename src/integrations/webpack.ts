import type { Compilation, Compiler } from "webpack";
import { buildEmulationScript } from "../emulation/build-script.js";
import { htmlScriptTag, type IabIntegrationOptions, resolveEnabled } from "./options.js";

const PLUGIN_NAME = "IabEmulatorWebpackPlugin";

// Minimal structural view of html-webpack-plugin — we never import it (it is an
// optional peer), only duck-type the constructor found among the configured
// plugins. Covers the v5 `getHooks(compilation).beforeEmit` injection point.
interface HtmlPluginData {
  html: string;
}
interface HtmlBeforeEmitHook {
  tap(name: string, cb: (data: HtmlPluginData) => HtmlPluginData): void;
}
interface HtmlWebpackPluginCtor {
  getHooks(compilation: Compilation): { beforeEmit: HtmlBeforeEmitHook };
}

// Returns the first html-webpack-plugin constructor (duck-typed by `getHooks`).
// Multi-instance HWP builds (e.g. multi-page) are not specifically supported —
// the script is injected via whichever instance's hooks fire per compilation.
function findHtmlWebpackPlugin(compiler: Compiler): HtmlWebpackPluginCtor | null {
  for (const plugin of compiler.options.plugins) {
    const ctor = (plugin as { constructor?: unknown } | undefined)?.constructor;
    if (ctor && typeof (ctor as Partial<HtmlWebpackPluginCtor>).getHooks === "function") {
      return ctor as HtmlWebpackPluginCtor;
    }
  }
  return null;
}

/**
 * webpack plugin that injects the emulation script into html-webpack-plugin's
 * generated HTML. Requires html-webpack-plugin in the build; if it is absent
 * the plugin no-ops with a warning.
 *
 * ```js
 * // webpack.config.js
 * const { IabEmulatorWebpackPlugin } = require("iab-emulator/webpack");
 * module.exports = { plugins: [new IabEmulatorWebpackPlugin({ apps: ["meta-ig"] })] };
 * ```
 */
export class IabEmulatorWebpackPlugin {
  private readonly options: IabIntegrationOptions;

  constructor(options: IabIntegrationOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    if (!resolveEnabled(this.options.enabled)) {
      return;
    }

    const tag = htmlScriptTag(buildEmulationScript(this.options));

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const ctor = findHtmlWebpackPlugin(compiler);
      if (!ctor) {
        console.warn(
          "[iab-emulator] html-webpack-plugin not found — emulation script not injected. See docs/integrations.md."
        );
        return;
      }
      ctor.getHooks(compilation).beforeEmit.tap(PLUGIN_NAME, (data) => {
        data.html = data.html.replace("<head>", `<head>${tag}`);
        return data;
      });
    });
  }
}
