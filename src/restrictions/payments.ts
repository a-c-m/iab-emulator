import type { Restriction } from "./schema.js";

/** Payment restrictions: the web payment surfaces in-app browsers don't expose. */
export const paymentRestrictions: Restriction[] = [
  {
    id: "payment-request-unavailable",
    category: "payments",
    description:
      "The Payment Request API is not exposed, so PaymentRequest-based checkouts fall through.",
    breaks: [
      "Stripe Payment Request Button (Apple Pay / Google Pay via PaymentRequest)",
      "Any checkout feature-detecting `window.PaymentRequest`",
    ],
    platforms: ["ios", "android"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2023-01",
    ref: "https://caniwebview.com/features/api-payment-request/",
    emulate(win) {
      Reflect.deleteProperty(win, "PaymentRequest");
      console.warn("[iab-emulator] window.PaymentRequest removed (unavailable in in-app browsers)");
    },
  },

  {
    id: "apple-pay-session-unavailable",
    category: "payments",
    description:
      "window.ApplePaySession is absent, so Apple Pay JS feature-detection fails inside the IAB.",
    breaks: [
      "Apple Pay buttons gated on `window.ApplePaySession`",
      "Braintree / Stripe Apple Pay JS integrations",
    ],
    platforms: ["ios"],
    apps: ["*"],
    confirmedVersion: "unknown",
    confirmedDate: "2023-01",
    ref: "https://caniwebview.com/features/api-apple-pay/",
    emulate(win) {
      Reflect.deleteProperty(win, "ApplePaySession");
      console.warn(
        "[iab-emulator] window.ApplePaySession removed (Apple Pay JS unavailable in in-app browsers)"
      );
    },
  },
];
