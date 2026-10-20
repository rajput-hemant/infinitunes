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
