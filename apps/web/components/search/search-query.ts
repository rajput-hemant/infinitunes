import type { Route } from "next";

import { asRoute } from "~/lib/utils";

function decodeOnce(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Dynamic route params arrive percent-encoded, and a literal `%` in the query
 * is written `%2525` (see `searchHref`), so the segment is decoded twice. Plain
 * `%20` style segments decode to the same text on the second pass.
 */
export function decodeSearchQuery(segment: string) {
  return decodeOnce(decodeOnce(segment));
}

/**
 * Next decodes the path once before it matches a dynamic route and the route
 * matcher decodes it again; a lone `%` left after the first pass is a 500. A
 * literal `%` is therefore encoded twice (`50%` -> `50%2525`).
 */
export function searchHref(query: string, type = "all"): Route {
  const segment = encodeURIComponent(query.trim()).replace(/%25/g, "%2525");
  return asRoute(`/search/${type}/${segment}`);
}
