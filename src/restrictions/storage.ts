import type { Restriction } from "./schema.js";

/** Storage restrictions: ITP cookie behaviour, the Storage Access API, purge. */
export const storageRestrictions: Restriction[] = [
  {
    id: "storage-access-denied",
    category: "storage",
    description:
      "document.requestStorageAccess() rejects, so third-party storage stays partitioned/blocked.",
    breaks: [
      "Embedded third-party widgets relying on the Storage Access API",
      "Cross-site session continuity after an OAuth redirect",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2023-03",
    ref: "https://webkit.org/blog/8124/introducing-storage-access-api/",
    emulate(win) {
      // defineProperty (not plain assignment): requestStorageAccess is a
      // prototype method that may be non-writable; a configurable own redefine
      // on the document shadows it robustly.
      Object.defineProperty(win.document, "requestStorageAccess", {
        configurable: true,
        writable: true,
        value: () => Promise.reject(new Error("[iab-emulator] Storage Access API denied")),
      });
    },
  },

  {
    id: "seven-day-script-writable-storage-cap",
    category: "storage",
    description:
      "WebKit ITP caps script-writable storage (localStorage, IndexedDB, cookies via document.cookie) to 7 days of use.",
    breaks: [
      "Persistent client-side sessions / 'remember me' across more than 7 days",
      "Long-lived analytics or experiment-assignment IDs in localStorage",
    ],
    platforms: ["ios"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2020-03",
    ref: "https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/",
    emulate() {
      // Not emulable at the JS level: the 7-day cap is enforced by the browser
      // over wall-clock time, not by any inspectable API. Listed so the
      // restriction is discoverable; verify on a real device after a 7-day gap.
    },
  },
];
