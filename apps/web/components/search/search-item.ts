import type { SearchItem } from "@infinitunes/types";

import { getHref } from "~/lib/utils";

import { searchHref } from "./search-query";

/** Artists in the combined search carry no `perma_url`, so they open their results list. */
export function getSearchItemHref(item: SearchItem) {
  return item.perma_url
    ? getHref(item.perma_url, item.type)
    : searchHref(item.title, "artist");
}
