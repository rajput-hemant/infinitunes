import {
  LIBRARY_FETCH_CONCURRENCY,
  settleWithLimit,
} from "@infinitunes/core/liked-songs";
import { uniqueBy } from "@infinitunes/types";

import {
  LIKED_COLLECTIONS,
  type LikedCollectionKind,
} from "./liked-collections";
import { useFavoriteIds } from "./use-favorite-ids";
import { useResolvedItems } from "./use-resolved-items";

/** Liked albums, artists, playlists or podcasts as cards, newest like first. */
export function useLikedCollection(kind: LikedCollectionKind) {
  const { column, resolve } = LIKED_COLLECTIONS[kind];

  return useResolvedItems({
    scope: `liked-${kind}`,
    source: useFavoriteIds(column),
    resolve: async (stored) => {
      const tokens = stored.toReversed();
      const settled = await settleWithLimit(
        tokens,
        LIBRARY_FETCH_CONCURRENCY,
        resolve,
      );
      // A token upstream no longer knows is skipped; none resolving at all
      // is an outage, not an empty library.
      const cards = settled.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
      return cards.length > 0 ? uniqueBy(cards, (card) => card.url) : undefined;
    },
  });
}
