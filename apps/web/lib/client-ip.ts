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
 *   `x-real-ip`, then the last entry (earlier entries are client-forgeable).
 * - `false`: headers are ignored; all clients share one key (a global cap),
 *   because Next 16 exposes no platform IP and a spoofable key is worse.
 */
export function getClientKey(headers: Headers, mode: TrustedProxy): string {
  if (mode === "false") return UNTRUSTED_CLIENT_KEY;
  const real = headers.get("x-real-ip")?.trim();
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const forwardedIp = mode === "vercel" ? forwarded?.at(0) : forwarded?.at(-1);
  return real || forwardedIp || UNTRUSTED_CLIENT_KEY;
}
