import {
  FAVORITE_COPY,
  isFavorited,
  type FavoriteLists,
  type FavoriteType,
} from "@infinitunes/core/favorites";
import {
  favoriteKey,
  toggleFavorite,
  useFavorite,
} from "@infinitunes/core/react/optimistic-favorite";
import { userMessage } from "@infinitunes/core/user-message";
import { useQuery } from "@tanstack/react-query";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { toast } from "sonner-native";

import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { promptSignIn, useUserId } from "./session";

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
 * anything has no row, which is an empty list, not an unknown one.
 */
export function useFavoriteLists(): FavoriteLists | null | undefined {
  const userId = useUserId();
  const { data, isError, isSuccess } = useQuery({
    ...trpc.user.getUserFavorites.queryOptions(),
    enabled: userId !== undefined,
  });
  if (isError) return null;
  if (!isSuccess) return undefined;
  return data ?? NOTHING_LIKED;
}

function persistFavorite(type: FavoriteType, token: string, liked: boolean) {
  const input = { type, token };
  const write = liked
    ? trpcClient.user.addToFavorites.mutate(input)
    : trpcClient.user.removeFromFavorites.mutate(input);
  return write
    .catch((error: unknown) => {
      toast.error(userMessage(error));
      throw error;
    })
    .finally(
      () =>
        void queryClient.invalidateQueries({
          queryKey: trpc.user.getUserFavorites.queryKey(),
        }),
    );
}

type FavoriteToggleOptions = { type: FavoriteType; token: string };

/**
 * Optimistic like for one item: `liked` flips in every heart that shows it
 * (row, header, player) in the same frame, the write follows, and a failure
 * rolls back with a toast. Signed out, `toggle` asks the listener to sign in.
 */
export function useFavoriteToggle({ type, token }: FavoriteToggleOptions) {
  const userId = useUserId();
  const lists = useFavoriteLists();
  const serverLiked = isFavorited(lists, type, token);
  const key = favoriteKey(type, token);
  const liked = useFavorite(key, serverLiked);

  function toggle() {
    if (!userId) {
      promptSignIn(
        `You need an account to like this ${FAVORITE_COPY[type].label.toLowerCase()}.`,
      );
      return;
    }
    // Unknown liked state: a write would toggle blindly.
    if (!lists) return;
    void impactAsync(ImpactFeedbackStyle.Light);
    toggleFavorite({
      key,
      serverLiked,
      send: (want) => persistFavorite(type, token, want),
    });
  }

  return { liked, toggle };
}
