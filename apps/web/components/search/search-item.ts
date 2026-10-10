import type { AllSearch, MediaType } from "@infinitunes/types";

import { getHref } from "~/lib/utils";

import { searchHref } from "./search-query";

/** One entry of a combined-search group, whose upstream item types differ per group. */
export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  perma_url?: string;
  type: MediaType;
  image: string;
};

export function getSearchItems(group: AllSearch[keyof AllSearch]) {
  return group.data as SearchItem[];
}

/** Artists in the combined search carry no `perma_url`, so they open their results list. */
export function getSearchItemHref(item: SearchItem) {
  return item.perma_url
    ? getHref(item.perma_url, item.type)
    : searchHref(item.title, "artist");
}
