export type TrustedProxy = "vercel" | "true" | "false";

/** Shared key for clients whose address cannot be trusted. */
export const UNTRUSTED_CLIENT_KEY = "untrusted";

/**
 * Resolves the effective trusted-proxy mode. An explicit `TRUSTED_PROXY` wins;
 * otherwise Vercel (which sets `VERCEL` and overwrites the client IP headers)
 * is trusted and everything else is not.
 */
export function resolveTrustedProxy(
  configured: TrustedProxy | undefined,
  vercel: string | undefined,
): TrustedProxy {
  return configured ?? (vercel ? "vercel" : "false");
}

/**
 * Rate-limit key for a request. Client-supplied `x-forwarded-for` /
 * `x-real-ip` are honoured only when a trusted proxy sets them:
 * - `vercel`: Vercel overwrites them, so `x-real-ip`, then the first entry.
 * - `true`: one trusted reverse proxy that appends to `x-forwarded-for`, so
 *   only its last entry; `x-real-ip` is ignored because a proxy may pass a
 *   client-supplied one through (earlier entries are client-forgeable too).
 * - `false`: headers are ignored; all clients share one key (a global cap),
 *   because Next 16 exposes no platform IP and a spoofable key is worse.
 */
export function getClientKey(headers: Headers, mode: TrustedProxy): string {
  if (mode === "false") return UNTRUSTED_CLIENT_KEY;
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (mode === "true") return forwarded?.at(-1) ?? UNTRUSTED_CLIENT_KEY;
  const real = headers.get("x-real-ip")?.trim();
  return real || forwarded?.at(0) || UNTRUSTED_CLIENT_KEY;
}

/**
 * Header Better Auth reads the client IP from. The auth route overwrites it
 * with `getClientKey`, so a forged copy never reaches Better Auth's limiter.
 * A non-IP key (`untrusted`) is rejected by Better Auth, which then falls back
 * to one shared per-path bucket.
 */
export const TRUSTED_CLIENT_IP_HEADER = "x-infinitunes-client-ip";

/** Copy of `request` with the trusted client IP header overwritten. */
export function withTrustedClientIp(
  request: Request,
  mode: TrustedProxy,
): Request {
  const headers = new Headers(request.headers);
  headers.set(TRUSTED_CLIENT_IP_HEADER, getClientKey(request.headers, mode));
  return new Request(request, { headers });
}
