import { isFavorited, type FavoriteType } from "@infinitunes/core/favorites";
import {
  favoriteKey,
  peekFavorite,
  useFavoriteOverlayVersion,
} from "@infinitunes/core/react/optimistic-favorite";

import { useFavoriteLists } from "~/user-data/favorites";

/**
 * The items of a liked list that still show as liked: an unlike hides its
 * item from the list (its count, Play and Shuffle included) in the same
 * frame, and a failed write brings it back.
 */
export function useStillLiked<T extends { id: string }>(
  type: FavoriteType,
  items: readonly T[],
): T[] {
  useFavoriteOverlayVersion();
  const lists = useFavoriteLists();
  return items.filter((item) =>
    peekFavorite(
      favoriteKey(type, item.id),
      // The items lag the liked ids for a moment after a confirmed unlike.
      lists ? isFavorited(lists, type, item.id) : true,
    ),
  );
}
