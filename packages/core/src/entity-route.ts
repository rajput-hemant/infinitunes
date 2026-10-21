import type { MediaType } from "@infinitunes/types";

/**
 * The app's entity paths, the same on the web and in the native app:
 *
 *   /<type>/<name>/<token>             album, playlist, song, episode, label, mix, radio
 *   /show/<name>/<season>/<token>      a podcast at one season
 *   /artist/<name>/<token>[/<tab>]     an artist's Overview, songs, albums or bio
 *
 * The name and season are read from the item's JioSaavn perma URL, whose
 * trailing segments these are. JioSaavn's own artist links, and the web's
 * earlier URLs, carry the tab as a suffix of the name slug instead
 * (`<name>-songs`); those map onto the routes above (see `legacyArtistPath`).
 */

export const ARTIST_TABS = ["overview", "songs", "albums", "bio"] as const;

export type ArtistTab = (typeof ARTIST_TABS)[number];

export function isArtistTab(value: unknown): value is ArtistTab {
  return ARTIST_TABS.some((tab) => tab === value);
}

const SLUG_TAB_SUFFIX = /^(.+)-(songs|albums|bio)$/;

/** Splits a legacy `<name>-songs` slug into the plain name and the tab it selects. */
export function splitArtistSlug(slug: string): {
  name: string;
  tab: ArtistTab;
} {
  const [, name, tab] = SLUG_TAB_SUFFIX.exec(slug) ?? [];
  return name && isArtistTab(tab)
    ? { name, tab }
    : { name: slug, tab: "overview" };
}

/** The path of an artist tab; the name must already be a plain slug. */
export function artistPath(name: string, token: string, tab: ArtistTab) {
  const base = `/artist/${name}/${token}`;

  return tab === "overview" ? base : `${base}/${tab}`;
}

/** The tab a child route segment selects (`null` is the Overview page itself). */
export function tabForSegment(segment: string | null | undefined): ArtistTab {
  return segment !== "overview" && isArtistTab(segment) ? segment : "overview";
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

/** An entity path's parts, by the shape of its route. */
export type EntityRoute =
  | { kind: "artist"; name: string; token: string; tab: ArtistTab }
  | { kind: "show"; name: string; season: string; token: string }
  | { kind: "entity"; type: MediaType; name: string; token: string };

const JIOSAAVN_URL_RE =
  /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:jiosaavn|saavn)\.com(?::\d+)?\/(.*)$/i;

/** The path of a JioSaavn URL, or an app-relative path as it is. */
function pathOf(url: string): string | undefined {
  if (url.startsWith("/")) return url;
  return JIOSAAVN_URL_RE.exec(url)?.[1];
}

/**
 * The route parts of an upstream item, from its type and its perma URL (a
 * JioSaavn URL, or a relative one like `more_info.label_url`). `undefined`
 * for any other URL, or one too short for the type.
 */
export function entityRoute(
  url: string | undefined | null,
  type: MediaType,
): EntityRoute | undefined {
  const path = url ? pathOf(url) : undefined;
  if (path === undefined) return undefined;

  const segments = (path.split(/[?#]/)[0] ?? "").split("/").filter(Boolean);
  if (type === "show") {
    const [name, season, token] = segments.slice(-3);
    return segments.length >= 3 && name && season && token
      ? { kind: "show", name, season, token }
      : undefined;
  }

  const [slug, token] = segments.slice(-2);
  if (segments.length < 2 || !slug || !token) return undefined;
  if (type === "artist") {
    return { kind: "artist", token, ...splitArtistSlug(slug) };
  }
  return { kind: "entity", type, name: slug, token };
}

/** The app path of an entity route. */
export function entityRoutePath(route: EntityRoute): string {
  switch (route.kind) {
    case "artist":
      return artistPath(route.name, route.token, route.tab);
    case "show":
      return `/show/${route.name}/${route.season}/${route.token}`;
    case "entity":
      return `/${route.type}/${route.name}/${route.token}`;
  }
}
