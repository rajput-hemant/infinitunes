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

/** The app's iOS bundle id and Android package (`apps/mobile/app.config.ts`). */
export const NATIVE_APP_ID = "com.infinitunes.app";

const SHA256_FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/**
 * The comma-separated `ANDROID_CERT_SHA256_FINGERPRINTS` value as a list of
 * uppercase colon hex. Throws on anything else: a typo would otherwise turn
 * into a passkey origin and asset link that silently never match.
 */
export function parseFingerprints(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter(Boolean)
    .map((fingerprint) => {
      if (!SHA256_FINGERPRINT.test(fingerprint)) {
        throw new Error(
          `ANDROID_CERT_SHA256_FINGERPRINTS: "${fingerprint}" is not a SHA-256 fingerprint (32 colon-separated hex bytes, as keytool prints it)`,
        );
      }
      return fingerprint;
    });
}

/**
 * The WebAuthn origin Android's Credential Manager signs for the app:
 * `android:apk-key-hash:` plus the base64url SHA-256 of its signing
 * certificate. `fingerprint` is the colon-separated hex that `keytool` and
 * Play Console show (the form `assetlinks.json` takes).
 */
export function androidApkKeyHashOrigin(fingerprint: string): string {
  const bytes = fingerprint.split(":").map((byte) => Number.parseInt(byte, 16));
  const base64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `android:apk-key-hash:${base64url}`;
}
