import type { FavoriteType } from "@infinitunes/core/favorites";
import { useTheme } from "expo-router";

import { announce } from "~/lib/announce";
import type { IconSize } from "~/theme/tokens";
import { useFavoriteToggle } from "~/user-data/favorites";
import { useUserId } from "~/user-data/session";

import { IconButton } from "./ui/icon-button";

type LikeButtonProps = {
  type: FavoriteType;
  /** The item's id (`artistId` for an artist). */
  token: string;
  name: string;
  /** A show's perma token, stored with the like. */
  linkToken?: string;
  /** `lg` by default; `md` in rows. */
  size?: IconSize;
  /** `tonal` in a header's action row, beside the other round buttons. */
  variant?: "standard" | "tonal";
};

/**
 * The heart for one item. Every heart for the same item flips together
 * (optimistic). Likes need an account, so a signed-out listener sees none.
 */
export function LikeButton({
  type,
  token,
  name,
  size,
  linkToken,
  variant,
}: LikeButtonProps) {
  const { colors } = useTheme();
  const signedIn = useUserId() !== undefined;
  const { liked, toggle } = useFavoriteToggle({ type, token, linkToken });
  if (!signedIn) return null;

  return (
    <IconButton
      haptic={false}
      icon={
        liked
          ? { ios: "heart.fill", android: "favorite" }
          : { ios: "heart", android: "favorite_border" }
      }
      label={liked ? `Unlike ${name}` : `Like ${name}`}
      onPress={() => {
        const nowLiked = toggle();
        if (nowLiked !== undefined) {
          announce(nowLiked ? `Liked ${name}` : `Removed ${name} from liked`);
        }
      }}
      size={size}
      variant={variant}
      color={liked ? colors.primary : undefined}
    />
  );
}
