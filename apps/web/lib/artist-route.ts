/**
 * The artist page's tabs are child routes of `/artist/<name>/<token>`:
 *
 *   /artist/<name>/<token>         Overview
 *   /artist/<name>/<token>/songs   Songs
 *   /artist/<name>/<token>/albums  Albums
 *   /artist/<name>/<token>/bio     Biography
 *
 * so the artist layout (header, tab row, shelves) persists while only the tab
 * panel changes. JioSaavn's own artist links, and this app's earlier URLs,
 * carry the tab as a suffix of the name slug instead (`<name>-songs`); those
 * map onto the routes above (see `legacyArtistPath`).
 */
export const ARTIST_TABS = ["overview", "songs", "albums", "bio"] as const;

export type ArtistTab = (typeof ARTIST_TABS)[number];

const SLUG_TAB_SUFFIX = /^(.+)-(songs|albums|bio)$/;

/** Splits a legacy `<name>-songs` slug into the plain name and the tab it selects. */
export function splitArtistSlug(slug: string): {
  name: string;
  tab: ArtistTab;
} {
  const match = SLUG_TAB_SUFFIX.exec(slug);
  if (!match) return { name: slug, tab: "overview" };

  return { name: match[1] ?? slug, tab: match[2] as ArtistTab };
}

/** The path of an artist tab; the name must already be a plain slug. */
export function artistPath(name: string, token: string, tab: ArtistTab) {
  const base = `/artist/${name}/${token}`;

  return tab === "overview" ? base : `${base}/${tab}`;
}

/** The tab a child route segment selects (`null` is the Overview page itself). */
export function tabForSegment(segment: string | null): ArtistTab {
  return segment === "songs" || segment === "albums" || segment === "bio"
    ? segment
    : "overview";
}

/**
 * The tab route for a legacy `/artist/<name>-<tab>/<token>` path, or `null`
 * when the path is not one (plain names, tab routes, other sections).
 */
export function legacyArtistPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "artist") return null;

  const [, slug = "", token = ""] = parts;
  const { name, tab } = splitArtistSlug(slug);
  if (tab === "overview") return null;

  return artistPath(name, token, tab);
}
