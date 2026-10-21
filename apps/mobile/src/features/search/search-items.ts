import type { AllSearch, MediaType } from "@infinitunes/types";

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

export type LinkedSearchItem = SearchItem & { perma_url: string };

function isSearchItem(value: unknown): value is SearchItem {
  if (typeof value !== "object" || value === null) return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "type" in value &&
    typeof value.type === "string" &&
    "image" in value &&
    typeof value.image === "string"
  );
}

export function isLinked(item: SearchItem): item is LinkedSearchItem {
  return Boolean(item.perma_url);
}

/** The group's entries; the upstream `episodes` group is untyped, so each is checked. */
export function getSearchItems(group: AllSearch[keyof AllSearch]) {
  const entries: readonly unknown[] = group.data;
  return entries.filter(isSearchItem);
}
