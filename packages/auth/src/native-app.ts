/**
 * URL scheme of the native app (`scheme` in `apps/mobile/app.config.ts`).
 * Its auth requests carry this origin, so the server trusts it.
 */
export const NATIVE_APP_SCHEME = "infinitunes";

export const NATIVE_APP_ORIGIN = `${NATIVE_APP_SCHEME}://`;

/**
 * React Native's fetch sends no `Origin`. The native app names its origin in
 * this header instead: Better Auth's `expo` plugin reads it on `/api/auth`,
 * the web proxy on `/api/trpc`.
 */
export const NATIVE_ORIGIN_HEADER = "expo-origin";
