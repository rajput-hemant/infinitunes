import { IMAGE_CDN_HOSTS, MEDIA_CDN_HOSTS } from "./image-hosts";

export const CSP_REPORT_ONLY_HEADER = "content-security-policy-report-only";

const UMAMI_SCRIPT_HOST = "https://us.umami.is";
const UMAMI_API_HOST = "https://api-gateway.umami.dev";

const https = (hosts: readonly string[]) => hosts.map((h) => `https://${h}`);

/**
 * Builds the (report-only) Content-Security-Policy header value.
 *
 * Before enforcing: every page must render dynamically per request (a static or
 * cached shell cannot carry the nonce; the root layout reads `cookies()` and
 * `headers()`, so all HTML routes qualify today); each inline script needs the
 * `x-nonce` header (the Umami script has it; `next-themes`' `ThemeProvider`
 * inline script and the `dangerouslySetInnerHTML` blocks do not, so check
 * them); `style-src` still allows `'unsafe-inline'`; and real violation
 * reports from a browser on a preview deployment must come back clean.
 */
export function buildCsp({
  nonce,
  isDev = false,
  umami = false,
}: {
  nonce: string;
  isDev?: boolean;
  umami?: boolean;
}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' is dev-only (React debugging); see Next's CSP guide.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...(umami ? [UMAMI_SCRIPT_HOST] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...https(IMAGE_CDN_HOSTS)],
    "media-src": ["'self'", "blob:", ...https(MEDIA_CDN_HOSTS)],
    "connect-src": [
      "'self'",
      ...https(MEDIA_CDN_HOSTS),
      ...(umami ? [UMAMI_SCRIPT_HOST, UMAMI_API_HOST] : []),
    ],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}
