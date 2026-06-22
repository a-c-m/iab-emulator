# Contributing to iab-emulator

The value of this package is a generic, well-referenced restriction manifest.
The bar for a new entry is: **confirmed, referenced, and self-contained.**

## Setup

```sh
pnpm install
pnpm check   # lint + typecheck + test + knip + security (needs the `trivy` binary)
```

## Adding a restriction

1. **Check it isn't already tracked** — search [docs/restrictions.md](docs/restrictions.md).
2. **Find a reference** — prefer [caniwebview.com](https://caniwebview.com),
   WebKit Bugzilla, Apple Developer Forums, or a reproducible GitHub issue.
3. **Add the entry** to the matching category file in `src/restrictions/`
   (`navigation.ts`, `payments.ts`, `storage.ts`, `apis.ts`) following the
   `Restriction` schema in `src/restrictions/schema.ts`.
4. **Write a test** in `test/restrictions.test.ts` that applies `emulate` to a
   JSDOM window and asserts the restricted behaviour.
5. **Document it** — add a row to `docs/restrictions.md` and an entry under
   `Unreleased` in `CHANGELOG.md`.
6. **Open a PR** titled `feat(restrictions): add <restriction-id>`.

## What makes a good `emulate()`

The function is serialized with `Function.prototype.toString()` and injected
into the page as a string (see [docs/adr/0001](docs/adr/0001-emulate-serialization.md)).

- **Self-contained — the one hard rule.** Reference only the `win` argument and
  page globals (`Object`, `Reflect`, `Promise`, `console`, `Element`, …). Never
  a module-scope import or constant — it becomes `undefined` in the page.
  `test/serializable.test.ts` enforces this.
- **Idempotent** — applying it twice must be safe.
- **Loud** — log suppressions via `console.warn("[iab-emulator] …")` so
  developers see what's being blocked in DevTools.
- Modern syntax (`const`, arrow, optional chaining) is fine — the build targets
  ES2022 and does not minify.
- If the restriction **can't** be emulated at the JS level (e.g. the 7-day
  storage purge), ship an empty body and explain why in a comment.

## What we don't accept

- Restrictions without a reference URL.
- Safari bugs that aren't actually IAB-specific.
- Emulations that monkey-patch `fetch` or `XMLHttpRequest` globally — too broad,
  and they cause cross-test interference.

## Stability

Restriction `id` values and `emulate` behaviour are treated as stable from
`0.1.0`: renaming an `id` or changing existing behaviour is a breaking change.
New entries are additive. Plugin option shapes (`apps`, `platform`,
`categories`, `enabled`) and the `detect` export are stable from `0.1.0`.
