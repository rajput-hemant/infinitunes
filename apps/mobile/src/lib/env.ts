import { parseApiUrl } from "./api-url";

/**
 * Build-time configuration. Expo inlines `process.env.EXPO_PUBLIC_*` only
 * when it is read with a static member expression, as here.
 */
export const env = {
  apiUrl: parseApiUrl(process.env.EXPO_PUBLIC_API_URL),
} as const;
