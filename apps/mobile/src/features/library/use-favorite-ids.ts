import type { FavoriteLists } from "@infinitunes/core/favorites";

import { queryClient } from "~/lib/query-client";
import { trpc } from "~/lib/trpc";
import { useFavoriteLists } from "~/user-data/favorites";

import { UNAVAILABLE, type IdSource } from "./use-resolved-items";

/** The liked ids of one kind (`songs`, `albums`, ...) as a list source. */
export function useFavoriteIds(column: keyof FavoriteLists): IdSource {
  const lists = useFavoriteLists();
  return {
    ids: lists?.[column],
    // `null` is a failed read: unknown, which must not look like "nothing liked".
    error: lists === null ? UNAVAILABLE : undefined,
    reload: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.user.getUserFavorites.queryKey(),
      }),
  };
}
