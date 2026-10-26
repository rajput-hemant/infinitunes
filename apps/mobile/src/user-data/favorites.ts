import {
  isFavorited,
  type FavoriteLists,
  type FavoriteType,
} from "@infinitunes/core/favorites";
import {
  favoriteKey,
  toggleFavorite,
  useFavorite,
} from "@infinitunes/core/react/optimistic-favorite";
import { useQuery } from "@tanstack/react-query";

import { showFailure } from "~/lib/failure";
import { confirm, tap } from "~/lib/haptics";
import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { promptSignIn, userQueryKey, useUserId } from "./session";

const NOTHING_LIKED: FavoriteLists = {
  songs: [],
  albums: [],
  playlists: [],
  artists: [],
  podcasts: [],
};

/**
 * The signed-in listener's liked tokens. `undefined` while signed out or
 * loading, `null` when the read failed: in both cases the liked state is
 * unknown, so nothing may be written over it. A user who never liked
 * anything has no row, which is an empty list, not an unknown one (and a
 * query may not resolve to `undefined`).
 */
export function useFavoriteLists(): FavoriteLists | null | undefined {
  const userId = useUserId();
  const { data, isError } = useQuery({
    ...favoriteListsQuery(userId),
    enabled: userId !== undefined,
  });
  return isError ? null : data;
}

/**
 * Whether the listener likes one item, from the same query as
 * `useFavoriteLists` but re-rendering only when this item's answer changes
 * (a list holds a heart per row). `undefined` while unknown, as there.
 */
function useIsFavorited(
  type: FavoriteType,
  token: string,
): boolean | undefined {
  const userId = useUserId();
  const { data, isError } = useQuery({
    ...favoriteListsQuery(userId),
    enabled: userId !== undefined,
    select: (lists) => isFavorited(lists, type, token),
  });
  return isError ? undefined : data;
}

/** The liked-tokens query of `userId`, for hooks and `queryClient.fetchQuery`. */
export function favoriteListsQuery(userId: string | undefined) {
  return {
    queryKey: userQueryKey(trpc.user.getUserFavorites.queryKey(), userId),
    queryFn: async (): Promise<FavoriteLists> =>
      (await trpcClient.user.getUserFavorites.query()) ?? NOTHING_LIKED,
  };
}

function persistFavorite(
  type: FavoriteType,
  token: string,
  liked: boolean,
  linkToken?: string,
) {
  const input = { type, token };
  const write = liked
    ? trpcClient.user.addToFavorites.mutate({ ...input, linkToken })
    : trpcClient.user.removeFromFavorites.mutate(input);
  return write
    .catch((error: unknown) => {
      showFailure("Couldn't update your likes. Try again.");
      // The overlay rolls the heart back on the rejection.
      throw error;
    })
    .finally(
      () =>
        void queryClient.invalidateQueries({
          queryKey: trpc.user.getUserFavorites.queryKey(),
        }),
    );
}

type FavoriteToggleOptions = {
  type: FavoriteType;
  token: string;
  /** A show's perma token, stored with the like. */
  linkToken?: string;
};

/**
 * Optimistic like for one item: `liked` flips in every heart that shows it
 * (row, header, player) in the same frame, the write follows, and a failure
 * rolls back. Signed out, `toggle` asks the listener to sign in.
 * `toggle` returns the liked state it asked for, or `undefined` when it wrote
 * nothing.
 */
export function useFavoriteToggle({
  type,
  token,
  linkToken,
}: FavoriteToggleOptions) {
  const userId = useUserId();
  const known = useIsFavorited(type, token);
  const serverLiked = known ?? false;
  const key = favoriteKey(type, token);
  const liked = useFavorite(key, serverLiked);

  function toggle(): boolean | undefined {
    if (!userId) {
      promptSignIn();
      return undefined;
    }
    // Unknown liked state: a write would toggle blindly.
    if (known === undefined) return undefined;
    // Liking is the success; unliking a plain tap.
    if (liked) tap();
    else confirm();
    toggleFavorite({
      key,
      serverLiked,
      send: (want) => persistFavorite(type, token, want, linkToken),
    });
    return !liked;
  }

  return { liked, toggle };
}
