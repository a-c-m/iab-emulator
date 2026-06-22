# Adding a restriction

The step-by-step workflow is in [CONTRIBUTING.md](../CONTRIBUTING.md). This page
is the field reference for the `Restriction` shape (`src/restrictions/schema.ts`).

| field | type | notes |
|---|---|---|
| `id` | `string` | Unique kebab-case. **Stable** — never rename once published. |
| `category` | `navigation \| payments \| storage \| api` | Determines the file it lives in. |
| `description` | `string` | One sentence: what the restriction *is*, not what it breaks. |
| `breaks` | `string[]` | Concrete affected integrations/patterns. Generic and specific both welcome. |
| `platforms` | `('ios' \| 'android')[]` | Many IAB restrictions are iOS/WKWebView only. |
| `apps` | `(AppId \| '*')[]` | `['*']` = all in-app browsers. Otherwise lowercase ids: `meta-fb`, `meta-ig`, `tiktok`, `linkedin`, `snapchat`, `pinterest`. |
| `confirmedVersion` | `string` | App/OS version where confirmed, or `'unknown'`. |
| `confirmedDate` | `string` | ISO month, `YYYY-MM`. |
| `ref` | `string` | Primary reference URL (required). |
| `refAlt` | `string?` | Optional secondary reference. |
| `emulate` | `(win: Window) => void` | Mutates `win`. See the rules below. |

## `emulate` rules

`emulate` is serialized via `Function.prototype.toString()` and injected into
the page as a string (see [adr/0001](adr/0001-emulate-serialization.md)).

- **Self-contained** — reference only `win` and page globals. No module-scope
  identifiers. Enforced by `test/serializable.test.ts`.
- **Idempotent** and **loud** (`console.warn("[iab-emulator] …")` on suppression).
- Modern syntax is fine (ES2022, un-minified build).
- Can't emulate it (e.g. a time-based purge)? Empty body + a comment saying why.

## Worked example

```ts
{
  id: "my-new-restriction",
  category: "api",
  description: "navigator.fooBar is absent in the IAB.",
  breaks: ["Libraries feature-detecting navigator.fooBar"],
  platforms: ["ios"],
  apps: ["*"],
  confirmedVersion: "unknown",
  confirmedDate: "2026-06",
  ref: "https://caniwebview.com/features/api-foo-bar/",
  emulate(win) {
    Reflect.deleteProperty(win.navigator, "fooBar");
    console.warn("[iab-emulator] navigator.fooBar removed");
  },
}
```
