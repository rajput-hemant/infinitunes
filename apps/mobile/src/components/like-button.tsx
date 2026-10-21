import type { FavoriteType } from "@infinitunes/core/favorites";
import { useTheme } from "expo-router";

import { useFavoriteToggle } from "~/user-data/favorites";

import { IconButton } from "./ui/icon-button";

type LikeButtonProps = {
  type: FavoriteType;
  /** The item's id (`artistId` for an artist). */
  token: string;
  name: string;
  size?: number;
};

/** The heart for one item. Every heart for the same item flips together (optimistic). */
export function LikeButton({ type, token, name, size }: LikeButtonProps) {
  const { colors } = useTheme();
  const { liked, toggle } = useFavoriteToggle({ type, token });

  return (
    <IconButton
      icon={
        liked
          ? { ios: "heart.fill", android: "favorite" }
          : { ios: "heart", android: "favorite_border" }
      }
      label={liked ? `Unlike ${name}` : `Like ${name}`}
      selected={liked}
      onPress={toggle}
      size={size}
      color={liked ? colors.primary : undefined}
    />
  );
}
