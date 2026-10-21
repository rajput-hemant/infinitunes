import { getErrorCode } from "@infinitunes/core/error-code";
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

/** A lookup that found nothing: upstream answered, but no longer has the item. */
function isGone(result: PromiseSettledResult<unknown>): boolean {
  return result.status === "fulfilled"
    ? !result.value
    : getErrorCode(result.reason) === "NOT_FOUND";
}

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
      // A token upstream no longer knows is skipped (counted as missing).
      // When none resolves, only a list of such tokens is a library of
      // removed items; any other failure means the service is down.
      const cards = settled.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
      if (cards.length > 0) return uniqueBy(cards, (card) => card.url);
      return settled.every(isGone) ? [] : undefined;
    },
  });
}
