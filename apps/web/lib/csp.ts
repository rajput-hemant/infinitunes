import { createHash } from "node:crypto";

import { IMAGE_CDN_HOSTS, MEDIA_CDN_HOSTS } from "./image-hosts";
import { THEME_BOOTSTRAP_SCRIPT } from "./theme-script";

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

/** CSP source expression allowing exactly this inline script text. */
export const scriptHash = (script: string) =>
  `'sha256-${createHash("sha256").update(script).digest("base64")}'`;

/**
 * Every inline script the app ships. Hashes come from the same strings the
 * layout renders, so they cannot drift from the markup. Next's own inline
 * scripts (the RSC payload pushes) are not listed: their text differs per page.
 */
const INLINE_SCRIPT_HASHES = [scriptHash(THEME_BOOTSTRAP_SCRIPT)];

/**
 * Builds the Content-Security-Policy header value (see `CSP_ENFORCE`).
 *
 * There is no per-request nonce, so the root layout stays prerenderable. The
 * app's inline script is allowed by hash (`INLINE_SCRIPT_HASHES`); the Umami
 * `<Script>` is external and allowed by host. Next's RSC payload scripts are
 * inline with per-page text, so a hash policy cannot cover them: resolve that
 * (for example `strict-dynamic` with SRI) before flipping `CSP_ENFORCE`. The two
 * `dangerouslySetInnerHTML` blocks (lyrics, artist bio) render
 * `sanitizeRichText` output as markup, not script, so `script-src` does not
 * apply to them. `style-src` keeps `'unsafe-inline'` on purpose: Sonner/Next
 * inject `<style>` tags and the theme script sets `--radius` inline, and style
 * injection cannot run script. `object-src`, `base-uri` and `form-action` are
 * locked down because they do not fall back to `default-src`.
 */
export function buildCsp({
  isDev = false,
  umami = false,
}: {
  isDev?: boolean;
  umami?: boolean;
} = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' is dev-only (React debugging); see Next's CSP guide.
    "script-src": [
      "'self'",
      ...INLINE_SCRIPT_HASHES,
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
