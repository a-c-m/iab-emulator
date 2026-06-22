# iab-emulator — agent brief

Standalone, open-source npm package. Lives at `repos/iab-emulator/` inside
base-app per [base-app ADR 0005](../../docs/adr/0005-child-apps-and-repos.md),
but is **cloned and published independently** — nothing here depends on the
parent. When working from the base-app root, the parent's `.claude/` hooks
still apply (ripgrep-only, one-command-at-a-time, commit-ticket rule).

## What it does

Emulates in-app-browser (IAB) restrictions — Meta, TikTok, LinkedIn, Snapchat —
in local dev and Playwright tests, so teams running paid-social traffic find
WKWebView/WebView breakage before their users do.

## Conventions

- **Package manager:** pnpm. Exact-pinned devDeps; `peerDependencies` are
  ranges (correct for a published lib). This repo carries its own
  `pnpm-workspace.yaml` so `pnpm` does not attach to the parent workspace.
- **Language:** TypeScript, ESM-only. `pnpm typecheck` (tsgo), `pnpm build`
  (tsc → `dist/`).
- **Lint/format:** Biome 2 + Ultracite — `pnpm lint` writes, `pnpm lint:check`
  verifies.
- **Test:** Vitest + jsdom — `pnpm test`, `pnpm test:cov` (coverage thresholds
  in `vitest.config.ts`).
- **Dead code:** `pnpm knip`. **Security:** `pnpm security` (Trivy; needs the
  `trivy` binary + network).
- **Full gate:** `pnpm check`.
- **Commits:** plain Conventional Commits — **no** trailing-ticket rule (that's
  a base-app-internal convention). PR titles: `feat(restrictions): add <id>`.

## The one rule that matters

`Restriction.emulate` bodies are serialized and injected into the page. They
MUST be self-contained — reference only `win` and page globals, never a
module-scope identifier. Enforced by `test/serializable.test.ts`. See
[docs/adr/0001](docs/adr/0001-emulate-serialization.md) and
[docs/adding-restriction.md](docs/adding-restriction.md).

## Layout

- `src/restrictions/` — the manifest (one file per category) + `schema.ts`.
- `src/emulation/` — `build-script.ts` (assembles the injectable script),
  `user-agents.ts`.
- `src/detect/` — runtime detection, **zero runtime deps**, browser-safe.
- `src/integrations/` — Vite, Next, webpack, Playwright adapters.
- `demo/` — a Vite capability-dashboard app (gated plugin via `IAB_DEMO_PLUGIN`).
- `e2e/` — Playwright suite demonstrating three modes (fixture / vite-plugin /
  control). `pnpm test:e2e` (needs `pnpm exec playwright install chromium`).
