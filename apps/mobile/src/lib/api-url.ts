/**
 * Validates the `EXPO_PUBLIC_API_URL` value and returns its origin, the web
 * app that serves `/api/trpc` and `/api/auth`.
 */
export function parseApiUrl(value: string | undefined): string {
  if (!value) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Copy apps/mobile/.env.example to apps/mobile/.env.local.",
    );
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_URL is not a valid URL: "${value}".`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      `EXPO_PUBLIC_API_URL must be an http(s) URL, got "${url.protocol}".`,
    );
  }
  return url.origin;
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * In development a loopback API (`http://127.0.0.1:3000`) only reaches the Mac
 * from the simulator, or from an Android phone through `adb reverse`. A phone
 * on Wi-Fi gets the Mac's address from Metro's own host (`hostUri`), so the
 * API follows the Mac's current IP instead of a stale one in `.env.local`.
 */
export function resolveDevApiUrl(
  origin: string,
  metroHostUri: string | undefined,
): string {
  const url = new URL(origin);
  const metroHost = metroHostUri?.split(":")[0];
  if (!metroHost || !LOOPBACK.has(url.hostname) || LOOPBACK.has(metroHost)) {
    return origin;
  }
  url.hostname = metroHost;
  return url.origin;
}
