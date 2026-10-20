/**
 * URL scheme of the native app (`expo.scheme` in `apps/mobile/app.json`).
 * Its auth requests carry this origin, so the server trusts it.
 */
export const NATIVE_APP_SCHEME = "infinitunes";

export const NATIVE_APP_ORIGIN = `${NATIVE_APP_SCHEME}://`;
