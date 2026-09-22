# Restriction manifest

Every restriction `iab-emulator` ships, with its stable `id`. `apps: *` means the
restriction is a WebView/WKWebView platform trait common to all in-app browsers,
not app-specific. See [adding-restriction.md](adding-restriction.md) to propose
a new entry.

## navigation

| id | platforms | apps | confirmed | what it does |
|---|---|---|---|---|
| `window-open-blocked` | ios, android | * | 2022-08 | `window.open()` returns `null` for any URL — no popup or new window opens. |
| `window-opener-null` | ios | meta-fb, meta-ig | 2024-06 | `window.opener` is always `null`, breaking postMessage callbacks. |
| `target-blank-suppressed` | ios, android | * | 2022-08 | `<a target="_blank">` clicks are silently suppressed. |

## payments

| id | platforms | apps | confirmed | what it does |
|---|---|---|---|---|
| `payment-request-unavailable` | ios, android | * | 2023-01 | `window.PaymentRequest` is not exposed. |
| `apple-pay-session-unavailable` | ios | * | 2023-01 | `window.ApplePaySession` is absent. |

## storage

| id | platforms | apps | confirmed | what it does |
|---|---|---|---|---|
| `storage-access-denied` | ios, android | * | 2023-03 | `document.requestStorageAccess()` rejects. |
| `seven-day-script-writable-storage-cap` | ios | * | 2020-03 | ITP caps script-writable storage to 7 days. **Not emulable** — documented only. |

## api

| id | platforms | apps | confirmed | what it does |
|---|---|---|---|---|
| `service-worker-unavailable` | ios, android | * | 2022-11 | `navigator.serviceWorker` is absent. |
| `fullscreen-api-blocked` | ios | * | 2023-05 | `Element.requestFullscreen()` rejects. |
| `clipboard-read-restricted` | ios, android | * | 2023-07 | `navigator.clipboard.readText()` rejects. |
| `notification-api-unavailable` | ios | * | 2026-09 | `window.Notification` is absent, so Web Notifications feature-detection fails. |

References for each entry live inline in the manifest source under
`src/restrictions/` (`ref` / `refAlt` fields).
