# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-06-20

Initial release. Usable, but the manifest and plugin API may still evolve
before `1.0.0`.

### Added

- Restriction manifest (10 entries) across four categories:
  - **navigation** — `window-open-blocked`, `window-opener-null`,
    `target-blank-suppressed`
  - **payments** — `payment-request-unavailable`,
    `apple-pay-session-unavailable`
  - **storage** — `storage-access-denied`,
    `seven-day-script-writable-storage-cap` (documented, non-emulable)
  - **api** — `service-worker-unavailable`, `fullscreen-api-blocked`,
    `clipboard-read-restricted`
- `buildEmulationScript()` / `selectRestrictions()` — assemble an injectable
  emulation script filtered by app, platform, and category.
- `iab-emulator/detect` — zero-dependency runtime detection (`detectIAB`,
  `isMetaIAB`, `supportsPopups`, `getCapabilities`).
- Integrations: `iab-emulator/vite`, `iab-emulator/next`, `iab-emulator/webpack`,
  `iab-emulator/playwright`.
- Known IAB user-agent strings for Meta (FB/IG), TikTok, LinkedIn, Snapchat,
  and Pinterest on iOS and Android.

[Unreleased]: https://github.com/a-c-m/iab-emulator/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/a-c-m/iab-emulator/releases/tag/v0.1.0
