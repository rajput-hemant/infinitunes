import type { SearchItem } from "@infinitunes/types";

export type LinkedSearchItem = SearchItem & { perma_url: string };

/** Whether the entry links to its own screen (artists and the top query do not). */
export function isLinked(item: SearchItem): item is LinkedSearchItem {
  return Boolean(item.perma_url);
}
