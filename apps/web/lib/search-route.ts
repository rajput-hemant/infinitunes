import { isSearchType } from "../app/(root)/search/(results)/[type]/[query]/_components/type-map";

/** Plural spellings people type or bookmark, mapped to the route's singular type. */
const TYPE_ALIASES: Readonly<Record<string, string>> = {
  songs: "song",
  albums: "album",
  playlists: "playlist",
  artists: "artist",
  shows: "show",
};

export type SearchRouteAction =
  | { kind: "redirect"; pathname: string }
  | { kind: "rewrite"; pathname: string }
  | { kind: "notFound" };

function decodesTwice(segment: string): boolean {
  try {
    decodeURIComponent(decodeURIComponent(segment));
    return true;
  } catch {
    return false;
  }
}

/**
 * Next decodes the path once before matching a dynamic route and the route
 * matcher then decodes it again, so a literal `%` (`/search/all/50%25`) fails
 * the second pass and the request dies with a bare 500. The query segment must
 * survive two decodes: this re-encodes stray percent signs to a form that does
 * (`50%2525`). `decodeSearchQuery` decodes twice to undo it. `null` means the
 * segment cannot be repaired.
 */
export function safeSearchSegment(segment: string): string | null {
  if (decodesTwice(segment)) return segment;

  const wellFormed = segment.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
  if (decodesTwice(wellFormed)) return wellFormed;

  const doubled = wellFormed.replace(/%25/g, "%2525");
  return decodesTwice(doubled) ? doubled : null;
}

/**
 * What the proxy must do with a `/search/<type>/<query>` request, or `null`
 * to let it through: plural types move permanently to the singular, unknown
 * types are a real 404 (the page itself streams behind a static shell, so it
 * cannot set the status), and malformed query segments are repaired.
 */
export function searchRouteAction(pathname: string): SearchRouteAction | null {
  const parts = pathname.split("/");
  if (parts.length !== 4 || parts[1] !== "search") return null;

  const [, , type = "", segment = ""] = parts;
  const safe = safeSearchSegment(segment);
  if (safe === null) return { kind: "notFound" };

  if (!isSearchType(type)) {
    const singular = Object.hasOwn(TYPE_ALIASES, type)
      ? TYPE_ALIASES[type]
      : undefined;
    return singular
      ? { kind: "redirect", pathname: `/search/${singular}/${safe}` }
      : { kind: "notFound" };
  }

  return safe === segment
    ? null
    : { kind: "rewrite", pathname: `/search/${type}/${safe}` };
}
