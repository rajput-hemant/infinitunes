import { siteConfig } from "~/config/site";

/**
 * The one production origin for canonical links, `og:url`, `metadataBase`,
 * robots and the sitemap. It is `NEXT_PUBLIC_APP_URL` (defaulting to the
 * production site), so a preview or a local build cannot leak its own origin
 * into indexed metadata unless that variable says so.
 */
export function siteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).href;
}
