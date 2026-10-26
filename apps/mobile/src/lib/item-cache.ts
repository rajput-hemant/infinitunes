import type { ItemCache } from "@infinitunes/core/liked-songs";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Catalog lookups by id (song rows, liked cards), one query entry each, so a
 * list whose ids change only fetches the new ones. Catalog data, not a
 * listener's: the same entry serves every account.
 */
const ITEM_KEY = ["catalog-item"] as const;

/** As fresh as the web's catalog cache keeps media-bearing details. */
const FRESH_MS = 10 * 60 * 1000;
/** No hook observes these entries: keep them between visits to a list. */
const KEEP_MS = 60 * 60 * 1000;

export type QueryItemCache<T> = ItemCache<T> & {
  /** Drops every entry of this kind (pull to refresh asks upstream again). */
  forget: () => void;
};

/** The per-id cache of one kind of lookup (`song-row`, `card-albums`). */
export function queryItemCache<T>(
  client: QueryClient,
  kind: string,
): QueryItemCache<T> {
  // Never shorten a longer default (tests keep everything: `Infinity`).
  const gcTime = client.getDefaultOptions().queries?.gcTime ?? 0;
  if (gcTime < KEEP_MS) {
    client.setQueryDefaults([...ITEM_KEY], { gcTime: KEEP_MS });
  }
  const key = (id: string) => [...ITEM_KEY, kind, id];
  return {
    get: (id) => {
      const state = client.getQueryState<T | null>(key(id));
      if (!state || state.data === undefined) return undefined;
      return Date.now() - state.dataUpdatedAt < FRESH_MS
        ? state.data
        : undefined;
    },
    set: (id, item) => void client.setQueryData(key(id), item),
    forget: () => client.removeQueries({ queryKey: [...ITEM_KEY, kind] }),
  };
}
