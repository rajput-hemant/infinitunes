"use client";

import React from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import type { User } from "next-auth";
import type { Favorite } from "@/lib/db/schema";
import type { Type } from "@/types";

import { addToFavorites, removeFromFavorites } from "@/lib/db/queries";
import { cn, currentlyInDev } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type LikeButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  user?: User;
  type: Type;
  name: string;
  token: string;
  favourites?: Favorite;
};

export function LikeButton(props: LikeButtonProps) {
  const { user, type, token, name, favourites, ...rest } = props;

  const isFavorite =
    favourites?.songs.includes(token) ||
    favourites?.albums.includes(token) ||
    favourites?.playlists.includes(token) ||
    favourites?.artists.includes(token) ||
    favourites?.podcasts.includes(token);

  const [optimisticLike, setOptimisticLike] = React.useOptimistic(
    isFavorite ?? false,
    (isLiked, _) => !isLiked
  );

  function likeHandler() {
    if (!user) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });

      return;
    }

    setOptimisticLike(true);

    switch (type) {
      case "song": {
        if (favourites?.songs.includes(token)) {
          toast.promise(removeFromFavorites(user.id!, token, type), {
            loading: "Removing from favorites...",
            success: `Successfully removed "${name}" from favorites!`,
            error: (e) => e.message,
          });
        } else {
          toast.promise(addToFavorites(user.id!, token, type), {
            loading: "Adding Song to favorites...",
            success: `"${name}" song added to favorites!`,
            error: (e) => e.message,
          });
        }
        break;
      }
      case "album": {
        if (favourites?.albums.includes(token)) {
          toast.promise(removeFromFavorites(user.id!, token, type), {
            loading: "Removing from favorites...",
            success: `Successfully removed "${name}" from favorites!`,
            error: (e) => e.message,
          });
        } else {
          toast.promise(addToFavorites(user.id!, token, type), {
            loading: "Adding Album to favorites...",
            success: `"${name}" album added to favorites!`,
            error: (e) => e.message,
          });
        }
        break;
      }
      case "playlist": {
        if (favourites?.playlists.includes(token)) {
          toast.promise(removeFromFavorites(user.id!, token, type), {
            loading: "Removing from favorites...",
            success: `"${name}" playlist removed from favorites!`,
            error: (e) => e.message,
          });
        } else {
          toast.promise(addToFavorites(user.id!, token, type), {
            loading: "Adding Playlist to favorites...",
            success: `"${name}" playlist added to favorites!`,
            error: (e) => e.message,
          });
        }
        break;
      }
      case "artist": {
        if (favourites?.artists.includes(token)) {
          toast.promise(removeFromFavorites(user.id!, token, type), {
            loading: "Removing from favorites...",
            success: `Successfully removed "${name}" from favorites!`,
            error: (e) => e.message,
          });
        } else {
          toast.promise(addToFavorites(user.id!, token, type), {
            loading: "Adding Artist to favorites...",
            success: `"${name}" artist added to favorites!`,
            error: (e) => e.message,
          });
        }
        break;
      }
      case "show": {
        if (favourites?.podcasts.includes(token)) {
          toast.promise(removeFromFavorites(user.id!, token, type), {
            loading: "Removing from favorites...",
            success: "Removed from favorites!",
            error: (e) => e.message,
          });
        } else {
          toast.promise(addToFavorites(user.id!, token, type), {
            loading: "Adding Podcast to favorites...",
            success: "Added Podcast to favorites!",
            error: (e) => e.message,
          });
        }
        break;
      }

      default:
        currentlyInDev();
    }
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger aria-label="Like" onClick={likeHandler} {...rest}>
        <Heart
          className={cn(
            "size-5 text-inherit transition-transform active:scale-105",
            optimisticLike && "fill-red-500 text-red-500"
          )}
        />
      </TooltipTrigger>

      <TooltipContent>
        {optimisticLike ? "Unlike" : "Like"} `{name}`
      </TooltipContent>
    </Tooltip>
  );
}
