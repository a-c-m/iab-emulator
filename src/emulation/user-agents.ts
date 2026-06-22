import type { AppId, AppScope, Platform } from "../restrictions/schema.js";

// Total map: every app declares both platforms, so lookup is always defined —
// no fallback or throw path to leave untested.
type UserAgentMap = Record<AppId, Record<Platform, string>>;

/**
 * Representative in-app-browser user-agent strings, per app + platform. These
 * are stable enough for triggering server-side UA sniffing and client-side
 * detection; they are not guaranteed to track the latest app build.
 */
const USER_AGENTS: UserAgentMap = {
  "meta-ig": {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 333.0.0.21.90 (iPhone15,2; iOS 17_5; en_US; en-US; scale=3.00; 1179x2556; 600000000)",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 333.0.0.21.90 Android (34/14; 420dpi; 1080x2400; Google/google; Pixel 8; shiba; shiba; en_US; 600000000)",
  },
  "meta-fb": {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/465.0.0.30.107;FBBV/600000000;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/465.0.0.30.107;]",
  },
  tiktok: {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_34.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240705.005) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 trill_340100 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/34.1.0 ByteLocale/en Region/US",
  },
  linkedin: {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LinkedInApp/9.29.0",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 LinkedInApp/4.1.900",
  },
  snapchat: {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.80.0.40 (iPhone15,2; iOS 17.5; gzip)",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Snapchat/12.80.0.40 (Pixel 8; Android 14#AP2A.240705.005#34; gzip)",
  },
  pinterest: {
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Pinterest for iOS/12.18",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Pinterest for Android/12.18",
  },
};

/** When an `"*"` app scope needs a concrete UA, fall back to the most common. */
const DEFAULT_APP: AppId = "meta-ig";

/** The IAB user-agent string for `app` on `platform`. `"*"` resolves to {@link DEFAULT_APP}. */
export function getUserAgent(app: AppScope, platform: Platform): string {
  const resolved: AppId = app === "*" ? DEFAULT_APP : app;
  return USER_AGENTS[resolved][platform];
}
