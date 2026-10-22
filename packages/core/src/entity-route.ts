import type { MediaType } from "@infinitunes/types";

/**
 * The app's entity paths, the same on the web and in the native app:
 *
 *   /<type>/<name>/<token>             album, playlist, song, episode, mix, radio
 *   /show/<name>/<season>/<token>      a podcast at one season
 *   /artist/<name>/<token>[/<tab>]     an artist's Overview, songs, albums or bio
 *   /label/<name>/<token>[/albums]     a label's songs or albums
 *
 * The name and season are read from the item's JioSaavn perma URL, whose
 * segments after the type's section these are (see `SECTIONS`). JioSaavn's own artist links, and the web's
 * earlier URLs, carry the tab as a suffix of the name slug instead
 * (`<name>-songs`); those map onto the routes above (see `legacyArtistPath`).
 * JioSaavn's label links do the same (`<name>-albums`, see `legacyLabelPath`).
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

export const LABEL_TABS = ["songs", "albums"] as const;

export type LabelTab = (typeof LABEL_TABS)[number];

export function isLabelTab(value: unknown): value is LabelTab {
  return LABEL_TABS.some((tab) => tab === value);
}

const LABEL_SLUG_TAB_SUFFIX = /^(.+)-(songs|albums)$/;

/** Splits JioSaavn's `<name>-albums` label slug into the plain name and its tab. */
export function splitLabelSlug(slug: string): { name: string; tab: LabelTab } {
  const [, name, tab] = LABEL_SLUG_TAB_SUFFIX.exec(slug) ?? [];
  return name && isLabelTab(tab) ? { name, tab } : { name: slug, tab: "songs" };
}

/** The path of a label tab (Songs is the bare route); the name must be a plain slug. */
export function labelPath(name: string, token: string, tab: LabelTab) {
  const base = `/label/${name}/${token}`;

  return tab === "songs" ? base : `${base}/${tab}`;
}

/** The label tab a child route segment selects (`null` is the Songs page itself). */
export function labelTabForSegment(
  segment: string | null | undefined,
): LabelTab {
  return segment === "albums" ? "albums" : "songs";
}

/**
 * The tab route for a legacy `/label/<name>-<tab>/<token>` path (both suffixes
 * move: `-songs` to the bare route, `-albums` to `/albums`), or `null` when the
 * path is not one.
 */
export function legacyLabelPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "label") return null;

  const [, slug = "", token = ""] = parts;
  const { name, tab } = splitLabelSlug(slug);
  if (name === slug) return null;

  return labelPath(name, token, tab);
}

/**
 * An entity path's parts, by the shape of its route. A label is an `entity`
 * whose `tab` selects its Songs or Albums route (the native app has one label
 * screen and ignores it).
 */
export type EntityRoute =
  | { kind: "artist"; name: string; token: string; tab: ArtistTab }
  | { kind: "show"; name: string; season: string; token: string }
  | {
      kind: "entity";
      type: MediaType;
      name: string;
      token: string;
      tab?: LabelTab;
    };

const JIOSAAVN_URL_RE =
  /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:jiosaavn|saavn)\.com(?::\d+)?\/(.*)$/i;

/** The path of a JioSaavn URL, or an app-relative path as it is. */
function pathOf(url: string): string | undefined {
  if (url.startsWith("/")) return url;
  return JIOSAAVN_URL_RE.exec(url)?.[1];
}

/**
 * The section a type's links start with: JioSaavn's (`featured` playlists,
 * `shows`, whose episodes are `/shows/<name>/<token>`), then the app's own
 * where it differs. Mixes are not seen live; `featured` is kept for them as
 * for playlists. A season has no page of its own (its link is its show's).
 */
const SECTIONS: Partial<Record<MediaType, readonly string[]>> = {
  album: ["album"],
  artist: ["artist"],
  channel: ["channel"],
  episode: ["shows", "episode"],
  label: ["label"],
  mix: ["mix", "featured"],
  playlist: ["featured", "playlist"],
  radio: ["radio"],
  radio_station: ["radio"],
  show: ["shows", "show"],
  song: ["song"],
};

/**
 * The segments after the type's section, or `undefined` when the path is in
 * another section. JioSaavn also nests sections under `/s/`, with at most one
 * qualifier before the name (`/s/album/hindi/<name>/<token>`, a user's
 * `/s/playlist/<owner>/<name>/<token>`); `arity` is the length of the rest.
 */
function sectionTail(
  segments: string[],
  type: MediaType,
  arity: number,
): string[] | undefined {
  const sections = SECTIONS[type] ?? [];
  const nested = segments[0] === "s";
  const [section, ...tail] = nested ? segments.slice(1) : segments;
  if (section === undefined || !sections.includes(section)) return undefined;
  if (tail.length === arity) return tail;
  return nested && tail.length === arity + 1 ? tail.slice(1) : undefined;
}

/**
 * The route parts of an upstream item, from its type and its perma URL (a
 * JioSaavn URL, or a relative one like `more_info.label_url`, or an app
 * path). `undefined` for any other URL, one in another type's section, or one
 * with too few or too many segments for the type.
 */
export function entityRoute(
  url: string | undefined | null,
  type: MediaType,
): EntityRoute | undefined {
  const path = url ? pathOf(url) : undefined;
  if (path === undefined) return undefined;

  const segments = (path.split(/[?#]/)[0] ?? "").split("/").filter(Boolean);
  if (type === "show") {
    const [name, season, token] = sectionTail(segments, type, 3) ?? [];
    return name && season && token
      ? { kind: "show", name, season, token }
      : undefined;
  }

  if (type === "artist") {
    // The app's own tab route, `/artist/<name>/<token>/<tab>`.
    const [name, token, tab] = sectionTail(segments, type, 3) ?? [];
    if (name && token && isArtistTab(tab)) {
      return { kind: "artist", name, token, tab };
    }
  }

  if (type === "label") {
    // The app's own Albums route, `/label/<name>/<token>/albums`.
    const [name, token, tab] = sectionTail(segments, type, 3) ?? [];
    if (name && token && tab === "albums") {
      return { kind: "entity", type, name, token, tab };
    }
  }

  const [slug, token] = sectionTail(segments, type, 2) ?? [];
  if (!slug || !token) return undefined;
  if (type === "artist") {
    return { kind: "artist", token, ...splitArtistSlug(slug) };
  }
  if (type === "label") {
    return { kind: "entity", type, token, ...splitLabelSlug(slug) };
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
      return route.type === "label"
        ? labelPath(route.name, route.token, route.tab ?? "songs")
        : `/${route.type}/${route.name}/${route.token}`;
  }
}
