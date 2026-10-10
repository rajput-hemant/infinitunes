import type { Favorite } from "@infinitunes/db/schema";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { getItemName } from "~/components/song-list/item-name";
import { unwrap } from "~/lib/action-result";
import type { User } from "~/lib/auth";
import { addToFavorites, removeFromFavorites } from "~/lib/db/queries";
import { userMessage } from "~/lib/user-message";

import type { TileMoreItem } from "./more-button-item";

type UseTileFavoriteOptions = {
  item: TileMoreItem;
  user?: User;
  favorites?: Favorite | null;
};

export function useTileFavorite(options: UseTileFavoriteOptions) {
  const { item, user, favorites } = options;
  const router = useRouter();

  const [isFavorite, setOptimisticFavorite] = React.useOptimistic(
    favorites?.songs.includes(item.id) ?? false,
    (_current, update: boolean) => update,
  );

  function like() {
    if (!user) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });
      return;
    }

    const name = getItemName(item);

    React.startTransition(async () => {
      setOptimisticFavorite(!isFavorite);
      const promise = unwrap(
        isFavorite
          ? removeFromFavorites(item.id, "song")
          : addToFavorites(item.id, "song"),
      );

      toast.promise(promise, {
        loading: isFavorite
          ? "Removing from favorites..."
          : "Adding Song to favorites...",
        success: isFavorite
          ? `Successfully removed "${name}" from favorites!`
          : `"${name}" song added to favorites!`,
        error: userMessage,
      });

      try {
        await promise;
        router.refresh();
      } catch {
        // Handled by toast.promise; transition failure reverts optimistic state
      }
    });
  }

  return { isFavorite, like };
}
