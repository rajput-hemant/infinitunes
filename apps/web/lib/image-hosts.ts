/**
 * Hostnames of the image CDN (also CSP `img-src`) and the server-side fetch
 * allowlist in `app/api/og/route.tsx` (an open `image` fetch is an SSRF
 * vector). Images are unoptimized, so `next.config.ts` has no remotePatterns.
 */
export const IMAGE_CDN_HOSTS = [
  "c.saavncdn.com",
  "c.sop.saavncdn.com",
] as const;

/**
 * Hostnames of social-login profile pictures: Better Auth stores Google's
 * `picture` and GitHub's `avatar_url` verbatim as `user.image`, and
 * `components/user-avatar.tsx` renders it. CSP `img-src` only; deliberately
 * not part of `IMAGE_CDN_HOSTS`, so `parseAllowedImageUrl` (the OG route's
 * server-side fetch allowlist) never fetches them.
 */
export const AVATAR_HOSTS = [
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
] as const;

/** Hostnames serving the decrypted `download_url` audio (CSP `media-src`). */
export const MEDIA_CDN_HOSTS = ["aac.saavncdn.com"] as const;

/**
 * Parses a user-supplied image URL and returns it only when it is an
 * `https` URL on an allowlisted CDN host (no credentials, default port).
 */
export function parseAllowedImageUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const allowed =
    url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    (IMAGE_CDN_HOSTS as readonly string[]).includes(url.hostname);

  return allowed ? url : null;
}
