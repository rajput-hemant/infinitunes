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
} as const;
