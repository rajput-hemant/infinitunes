import { IMAGE_CDN_HOSTS, MEDIA_CDN_HOSTS } from "./image-hosts";

export const CSP_ENFORCING_HEADER = "content-security-policy";
export const CSP_REPORT_ONLY_HEADER = "content-security-policy-report-only";

/**
 * The single switch between observing and enforcing the policy. Keep `false`
 * until a real browser session on a production build shows no violations
 * (SE-10/SE-18), then flip it to `true`.
 */
export const CSP_ENFORCE = false;

export const cspHeaderName = (enforce: boolean = CSP_ENFORCE) =>
  enforce ? CSP_ENFORCING_HEADER : CSP_REPORT_ONLY_HEADER;

const UMAMI_SCRIPT_HOST = "https://us.umami.is";
const UMAMI_API_HOST = "https://gateway.umami.is";

const https = (hosts: readonly string[]) => hosts.map((h) => `https://${h}`);

/**
 * Builds the Content-Security-Policy header value (see `CSP_ENFORCE`).
 *
 * Prerequisites for enforcing (SE-15): every HTML route renders dynamically per
 * request (the root layout reads `cookies()` and `headers()`), so the nonce is
 * available. Both inline scripts carry it: the Umami `<Script>` and the
 * `next-themes` bootstrap (`nonce` prop on `ThemeProvider`, passed from the root
 * layout). The two `dangerouslySetInnerHTML` blocks (lyrics, artist bio) render
 * `sanitizeRichText` output as markup, not script, so `script-src` does not
 * apply to them. `style-src` keeps `'unsafe-inline'` on purpose: the layout sets
 * `style` attributes server-side and Sonner/Next inject `<style>` tags, and
 * style injection cannot run script. `object-src`, `base-uri` and `form-action`
 * are locked down because they do not fall back to `default-src`.
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
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}
