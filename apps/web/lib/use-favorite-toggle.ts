"use client";

import {
  FAVORITE_COPY,
  isFavorited,
  type FavoriteType,
} from "@infinitunes/core/favorites";
import {
  favoriteKey,
  toggleFavorite,
  useFavorite,
} from "@infinitunes/core/react/optimistic-favorite";
import { userMessage } from "@infinitunes/core/user-message";
import type { Favorite } from "@infinitunes/db/schema";
import { toast } from "sonner";

import { unwrap } from "~/lib/action-result";
import { addToFavorites, removeFromFavorites } from "~/lib/actions";
import type { User } from "~/lib/auth";

type FavoriteToggleOptions = {
  type: FavoriteType;
  token: string;
  name: string;
  user?: User;
  /** `null`: the favorites read failed, so the state is unknown. */
  favorites?: Favorite | null;
  /** Legacy alias. */
  favourites?: Favorite | null;
};

/**
 * Optimistic like for one item. `liked` flips on click, in every component that
 * shows this item; the write follows, and a failure rolls back with a toast.
 */
export function useFavoriteToggle(options: FavoriteToggleOptions) {
  const { type, token, name, user, favorites, favourites } = options;
  const currentFavorites = favorites !== undefined ? favorites : favourites;
  const copy = FAVORITE_COPY[type];
  const serverLiked = isFavorited(currentFavorites, type, token);
  const key = favoriteKey(type, token);
  const liked = useFavorite(key, serverLiked);

  /** Returns true when the click started a toggle. */
  function toggle(): boolean {
    // Unknown favorites state: a write would toggle blindly.
    if (currentFavorites === null) return false;

    if (!user) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });
      return false;
    }

    toggleFavorite({
      key,
      serverLiked,
      send: (want) =>
        toast
          .promise(
            unwrap(
              want
                ? addToFavorites(token, type)
                : removeFromFavorites(token, type),
            ),
            want
              ? {
                  loading: `Adding ${copy.label} to favorites...`,
                  success: copy.added(name),
                  error: userMessage,
                }
              : {
                  loading: "Removing from favorites...",
                  success: copy.removed(name),
                  error: userMessage,
                },
          )
          .unwrap(),
    });
    return true;
  }

  return { liked, toggle };
}
