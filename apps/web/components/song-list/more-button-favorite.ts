import type { Favorite } from "@infinitunes/db/schema";

import { getItemName } from "~/components/song-list/item-name";
import type { User } from "~/lib/auth";
import { useFavoriteToggle } from "~/lib/use-favorite-toggle";

import type { TileMoreItem } from "./more-button-item";

type UseTileFavoriteOptions = {
  item: TileMoreItem;
  user?: User;
  favorites?: Favorite | null;
};

/** The tile menu's like: shares one optimistic state with every heart for the song. */
export function useTileFavorite(options: UseTileFavoriteOptions) {
  const { item, user, favorites } = options;
  const { liked, toggle } = useFavoriteToggle({
    type: "song",
    token: item.id,
    name: getItemName(item),
    user,
    favourites: favorites,
  });

  return { isFavorite: liked, like: toggle };
}
