import type { MetadataRoute } from "next";

import { siteUrl } from "~/lib/site-url";

// Static pages and the catalog's listing pages only. Entity pages are reached
// from these, so the sitemap never walks the catalog or hits the upstream API.
const SITEMAP_PATHS = [
  "/",
  "/album",
  "/artist",
  "/browse",
  "/chart",
  "/playlist",
  "/radio",
  "/show",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({ url: siteUrl(path) }));
}
