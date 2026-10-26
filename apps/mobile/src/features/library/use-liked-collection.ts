import { lookupEach, resolveWithCache } from "@infinitunes/core/liked-songs";
import { uniqueBy, type CardItem } from "@infinitunes/types";

import {
  LIKED_COLLECTIONS,
  type LikedCollectionKind,
} from "./liked-collections";
import { useFavoriteIds } from "./use-favorite-ids";
import { useResolvedItems } from "./use-resolved-items";

/**
 * Liked albums, artists, playlists or podcasts as cards, newest like first.
 * Each token's card is cached, so a like fetches one card and an unlike none.
 */
export function useLikedCollection(kind: LikedCollectionKind) {
  const { column, resolve } = LIKED_COLLECTIONS[kind];

  return useResolvedItems<CardItem>({
    scope: `liked-${kind}`,
    itemKind: `card-${kind}`,
    source: useFavoriteIds(column),
    resolve: async (stored, cache) => {
      // A token upstream no longer knows is skipped (counted as missing).
      // When none resolves, only a list of such tokens is a library of
      // removed items; any other failure means the service is down.
      const cards = await resolveWithCache(
        [...stored].reverse(),
        cache,
        (ids) => lookupEach(ids, resolve),
      );
      return cards && uniqueBy(cards, (card) => card.url);
    },
  });
}
