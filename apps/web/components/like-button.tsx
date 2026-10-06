"use client";

import type { Favorite } from "@infinitunes/db/schema";
import type { MediaType } from "@infinitunes/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Heart } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { unwrap } from "~/lib/action-result";
import type { User } from "~/lib/auth";
import { addToFavorites, removeFromFavorites } from "~/lib/db/queries";
import { userMessage } from "~/lib/user-message";
import { cn } from "~/lib/utils";

// Types the favorites table has a column for; other media types are not likable.
const FAVORITE_TYPES = ["song", "album", "playlist", "artist", "show"] as const;

function isFavoriteType(
  type: MediaType,
): type is (typeof FAVORITE_TYPES)[number] {
  return (FAVORITE_TYPES as readonly string[]).includes(type);
}

type FavoriteType = (typeof FAVORITE_TYPES)[number];

const removedDefault = (name: string) =>
  `Successfully removed "${name}" from favorites!`;

// Favorites column and toast copy per likable type.
const FAVORITE_COPY: Record<
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

type LikeButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  user?: User;
  type: MediaType;
  name: string;
  token: string;
  favourites?: Favorite;
};

export function LikeButton(props: LikeButtonProps) {
  const { user, type, token, name, favourites, className, ...rest } = props;

  const isFavorite =
    favourites?.songs.includes(token) ||
    favourites?.albums.includes(token) ||
    favourites?.playlists.includes(token) ||
    favourites?.artists.includes(token) ||
    favourites?.podcasts.includes(token);

  const [optimisticLike, setOptimisticLike] = React.useOptimistic(
    isFavorite ?? false,
    (isLiked) => !isLiked,
  );

  if (!isFavoriteType(type)) {
    return null;
  }

  function likeHandler() {
    if (!isFavoriteType(type)) return;

    if (!user) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });

      return;
    }

    React.startTransition(async () => {
      setOptimisticLike(true);

      const copy = FAVORITE_COPY[type];
      const liked = favourites?.[copy.key].includes(token);
      const pending = toast.promise(
        unwrap(
          liked
            ? removeFromFavorites(token, type)
            : addToFavorites(token, type),
        ),
        liked
          ? {
              loading: "Removing from favorites...",
              success: copy.removed(name),
              error: userMessage,
            }
          : {
              loading: `Adding ${copy.label} to favorites...`,
              success: copy.added(name),
              error: userMessage,
            },
      );

      // Keep the optimistic state until the action settles (toast shows errors).
      await pending.unwrap().catch(() => undefined);
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label="Like"
        aria-pressed={optimisticLike}
        onClick={likeHandler}
        className={cn(
          "inline-flex items-center justify-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...rest}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            "size-5 text-inherit transition-transform duration-150 ease-out active:scale-95",
            optimisticLike && "fill-destructive text-destructive",
          )}
        />
      </TooltipTrigger>

      <TooltipContent>
        {optimisticLike ? "Unlike" : "Like"} `{name}`
      </TooltipContent>
    </Tooltip>
  );
}
