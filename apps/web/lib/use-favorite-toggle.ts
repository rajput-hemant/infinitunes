"use client";

import type { Favorite } from "@infinitunes/db/schema";
import { toast } from "sonner";

import { unwrap } from "~/lib/action-result";
import { addToFavorites, removeFromFavorites } from "~/lib/actions";
import type { User } from "~/lib/auth";
import {
  favoriteKey,
  toggleFavorite,
  useFavorite,
} from "~/lib/optimistic-favorite";
import { userMessage } from "~/lib/user-message";

// Types the favorites table has a column for; other media types are not likable.
export const FAVORITE_TYPES = [
  "song",
  "album",
  "playlist",
  "artist",
  "show",
] as const;

export type FavoriteType = (typeof FAVORITE_TYPES)[number];

export function isFavoriteType(type: string): type is FavoriteType {
  return (FAVORITE_TYPES as readonly string[]).includes(type);
}

const removedDefault = (name: string) =>
  `Successfully removed "${name}" from favorites!`;

// Favorites column and toast copy per likable type.
export const FAVORITE_COPY: Record<
  FavoriteType,
  {
    key: keyof Pick<
      Favorite,
      "songs" | "albums" | "playlists" | "artists" | "podcasts"
    >;
    label: string;
    removed: (name: string) => string;
    added: (name: string) => string;
  }
> = {
  song: {
    key: "songs",
    label: "Song",
    removed: removedDefault,
    added: (name) => `"${name}" song added to favorites!`,
  },
  album: {
    key: "albums",
    label: "Album",
    removed: removedDefault,
    added: (name) => `"${name}" album added to favorites!`,
  },
  playlist: {
    key: "playlists",
    label: "Playlist",
    removed: (name) => `"${name}" playlist removed from favorites!`,
    added: (name) => `"${name}" playlist added to favorites!`,
  },
  artist: {
    key: "artists",
    label: "Artist",
    removed: removedDefault,
    added: (name) => `"${name}" artist added to favorites!`,
  },
  show: {
    key: "podcasts",
    label: "Podcast",
    removed: () => "Removed from favorites!",
    added: () => "Added Podcast to favorites!",
  },
};

type FavoriteToggleOptions = {
  type: FavoriteType;
  token: string;
  name: string;
  user?: User;
  /** `null`: the favorites read failed, so the state is unknown. */
  favourites?: Favorite | null;
};

/**
 * Optimistic like for one item. `liked` flips on click, in every component that
 * shows this item; the write follows, and a failure rolls back with a toast.
 */
export function useFavoriteToggle(options: FavoriteToggleOptions) {
  const { type, token, name, user, favourites } = options;
  const copy = FAVORITE_COPY[type];
  const serverLiked = favourites?.[copy.key].includes(token) ?? false;
  const key = favoriteKey(type, token);
  const liked = useFavorite(key, serverLiked);

  /** Returns true when the click started a toggle. */
  function toggle(): boolean {
    // Unknown favorites state: a write would toggle blindly.
    if (favourites === null) return false;

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
