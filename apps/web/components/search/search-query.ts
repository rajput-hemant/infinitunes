import type { Route } from "next";

import { asRoute } from "~/lib/utils";

/** Dynamic route params arrive percent-encoded; fall back to the raw segment when malformed. */
export function decodeSearchQuery(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function searchHref(query: string, type = "all"): Route {
  return asRoute(`/search/${type}/${encodeURIComponent(query.trim())}`);
}
