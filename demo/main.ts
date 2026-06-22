// Demo page logic. Imports iab-emulator by relative source path; a real consumer
// would import from "iab-emulator/detect". Probes the capabilities that in-app
// browsers restrict and writes results into [data-testid] elements the
// Playwright e2e suite asserts on.
import { detectIAB, supportsPopups } from "../src/detect/index.js";

function set(testid: string, value: string): void {
  const el = document.querySelector(`[data-testid="${testid}"]`);
  if (el) {
    el.textContent = value;
  }
}

set("payment-request", "PaymentRequest" in window ? "present" : "absent");
set("service-worker", "serviceWorker" in navigator ? "present" : "absent");
set("client-ua", navigator.userAgent);

const detection = detectIAB();
set("detected-app", detection.isIAB && detection.app ? detection.app : "none");

// Echo back the user-agent the server saw. Request as text/html so the Vite
// plugin (which only spoofs the UA on document navigations, not assets/XHR)
// treats this like a navigation — mirroring real server-side UA sniffing.
fetch("/echo-ua", { headers: { accept: "text/html" } })
  .then((r) => r.text())
  .then((ua) => set("server-ua", ua))
  .catch(() => set("server-ua", "error"));

// Popup probe. 127.0.0.1:9 (discard port) is a guaranteed-dead, cross-origin
// target chosen so the probe never loads real content — we only care whether
// window.open() returns a handle. IAB emulation blocks ALL window.open (returns
// null); a real browser returns a handle synchronously.
const CROSS_ORIGIN = "http://127.0.0.1:9/";
document.querySelector("#popup-btn")?.addEventListener("click", () => {
  const opened = window.open(CROSS_ORIGIN, "_blank", "width=1,height=1");
  set("popup-result", opened ? "opened" : "blocked");
  opened?.close();
});

// Exercise the real product API supportsPopups() inside a user gesture (must be
// a click — calling it on load trips the browser's own popup blocker).
document.querySelector("#popups-btn")?.addEventListener("click", () => {
  set("popups-result", supportsPopups() ? "supported" : "blocked");
});

// target="_blank" link: IAB emulation prevents the default in the capture
// phase. We read whether it was already prevented, then prevent it ourselves so
// the test stays on the page either way.
document.querySelector("#blank-link")?.addEventListener("click", (e) => {
  set("blank-result", e.defaultPrevented ? "suppressed" : "default");
  e.preventDefault();
});
