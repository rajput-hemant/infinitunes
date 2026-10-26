import Constants from "expo-constants";

import { parseApiUrl, resolveDevApiUrl } from "./api-url";

const apiUrl = parseApiUrl(process.env.EXPO_PUBLIC_API_URL);

/**
 * Build-time configuration. Expo inlines `process.env.EXPO_PUBLIC_*` only
 * when it is read with a static member expression, as here.
 */
export const env = {
  apiUrl: __DEV__
    ? resolveDevApiUrl(apiUrl, Constants.expoConfig?.hostUri)
    : apiUrl,
  /** The server's Google web client (`GOOGLE_CLIENT_ID`): ID tokens name it. */
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  /** Google's iOS client, whose reversed id is the app's URL scheme. */
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  /** Passkeys need the web domain as an associated domain: https only. */
  passkeys: apiUrl.startsWith("https:"),
  /** Signed by a paid Apple team: Sign in with Apple and iOS passkeys (`app.config.ts`). */
  applePaidTeam: process.env.EXPO_PUBLIC_APPLE_PAID_TEAM === "true",
} as const;
