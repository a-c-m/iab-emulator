import { defineConfig } from "vite";
import { createDemoConfig } from "./vite.config.js";

// The "just works" manual-test entry: emulation + the IAB frame, no env vars.
// Launched by `pnpm try`. Kept separate from the env-driven default config so
// the e2e webServers (clean / plugin modes) are unaffected.
export default defineConfig(createDemoConfig({ plugin: true, chrome: true }));
