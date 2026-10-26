export type LimiterKind = "global" | "auth" | "og";

/**
 * Matcher for `proxy.ts`. Pages, `/api/trpc`, `/api/auth` and `/api/og` run
 * through it; static assets (`_next/`, the favicon, `/images/`, `/fonts/` and
 * top-level files in `public/` by extension; a nested page path that merely ends
 * in an extension, such as `/search/all/50%.json`, still runs) and every other API route do not.
 */
export const PROXY_MATCHER = [
  "/api/trpc/:path*",
  "/((?!api/(?!trpc|auth|og)|_next/|favicon\\.ico|(?:images|fonts)/|[^/]+\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|css|js|map|txt|xml|json|webmanifest|mp3|mp4)$).*)",
];

/**
 * Credential endpoints get a stricter per-client bucket on top of the global
 * one. Better Auth's own limiter stays authoritative for those paths; this adds
 * a sustained cap. The reset endpoints are left to Better Auth alone.
 */
const AUTH_CREDENTIAL_PATHS = new Set([
  "/api/auth/sign-in/email",
  "/api/auth/sign-up/email",
]);

/** An OG image costs a render and a remote fetch, so it has its own cap. */
export const OG_PATH = "/api/og";

export const LIMITS = {
  auth: { requests: 10, window: "1 m" },
  og: { requests: 20, window: "1 m" },
} as const;

type RequestShape = { pathname: string; method: string; headers: Headers };

/**
 * Next client navigations and link prefetches are RSC fetches (`rsc` header).
 * They are cache backed and a page prefetches many links at once, so counting
 * them would turn normal browsing into 429s. Subresources (`sec-fetch-dest`
 * image, script, style, font, ...) are not documents either. A missing
 * `sec-fetch-dest` (curl, bots) is treated as a document.
 */
function isDocumentRequest({ headers }: RequestShape): boolean {
  if (headers.has("rsc") || headers.has("next-router-prefetch")) return false;
  const dest = headers.get("sec-fetch-dest");
  return dest === null || dest === "document" || dest === "iframe";
}

/**
 * Which buckets a request is charged to; empty means it is not limited.
 * Limited: every `/api` request that reaches the proxy, document requests and
 * server actions (`next-action`, a POST to a page path).
 */
export function limiterKinds(req: RequestShape): LimiterKind[] {
  const { pathname, method, headers } = req;
  if (pathname === OG_PATH) return ["global", "og"];
  if (pathname.startsWith("/api/")) {
    return method === "POST" && AUTH_CREDENTIAL_PATHS.has(pathname)
      ? ["global", "auth"]
      : ["global"];
  }
  if (headers.has("next-action") || isDocumentRequest(req)) return ["global"];
  return [];
}
