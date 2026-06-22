# ADR 0001: `emulate` serialization and ESM-only distribution

**Status:** Accepted (2026-06-20)

## Context

`iab-emulator` emulates in-app-browser restrictions by running small functions
in the page's context. Those functions (`Restriction.emulate`) are authored in
TypeScript here, but they do not run here — they run in the **target page**,
injected by a Vite `transformIndexHtml`, a Playwright `addInitScript`, or a
webpack/Next adapter.

The injection mechanism is serialization: `buildEmulationScript()` calls
`Function.prototype.toString()` on each `emulate`, concatenates the bodies into
an IIFE string, and the integration injects that string into the page.

This forces two decisions.

## Decision 1 — `emulate` bodies must be self-contained

A serialized function loses its closure. Any reference to a module-scope
identifier (an imported helper, a shared constant) resolves to `undefined` in
the page and the emulation silently breaks.

**Rule:** an `emulate` body may reference only its `win` argument and standard
page globals (`Object`, `Reflect`, `Promise`, `console`, `Element`, …). This is
the single hard constraint on a restriction entry, and it is enforced
mechanically by `test/serializable.test.ts`, which reconstructs each `emulate`
via the `Function` constructor (no closure access) and runs it against a fresh
JSDOM window — a module-scope reference throws `ReferenceError` and fails CI.

We do **not** require ES5 syntax (`var`/`function` only), as an early draft
did. That guidance was cargo-culted caution. The build targets ES2022 and does
**not** minify (`tsc`, not a bundler), so the serialized output is exactly the
authored body, and `const`/arrow/optional-chaining all run in every in-app
browser of the last several years. Biome enforces normal modern style.

`serializeEmulate` normalizes the three function forms `toString()` can
produce — method-shorthand (`emulate(win){…}`), function expression, and arrow
— to a callable expression, and wraps each in `try/catch` so one failing
restriction cannot abort the rest.

## Decision 2 — ESM-only distribution

The package ships ESM only: `tsc` emits `dist/**/*.js` + `.d.ts`, and the
`exports` map points `default` at the built JS. No CJS build.

Rationale: Node ≥22 (our floor) supports ESM natively; every integration
consumer (Vite/Next/webpack/Playwright config) and the browser-bundled
`detect` entry are ESM-native; and a dual build doubles the surface for no
current consumer. If a CJS-only consumer ever materializes, a `tsup` dual emit
can be added without changing the source. This mirrors base-app
[ADR 0039](../../../../docs/adr/0039-shared-library-packaging.md)'s "built
`dist/`" stance, minus the `customConditions: ["source"]` dev path (that exists
to serve in-workspace consumers; iab-emulator is consumed only as published
`dist`).

## Consequences

- New restrictions are constrained but trivially testable; the serializability
  test is the gate.
- Consumers on legacy CJS-only toolchains are unsupported at 0.1.0 (documented
  in the README's Node target).
- `dist` must not be minified by any future build change, or `toString()` would
  emit mangled (though still valid) bodies — acceptable, but the no-minify
  choice keeps injected scripts readable in DevTools.
