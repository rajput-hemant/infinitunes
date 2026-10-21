import type { FavoriteType } from "@infinitunes/core/favorites";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { View } from "react-native";

import { radii } from "~/theme/tokens";

import { LikeButton } from "./like-button";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

/** Artwork edge in points: the detail screen's focal point, about half a phone's width. */
export const ENTITY_ART_SIZE = 220;

type EntityHeaderProps = {
  /** Raw upstream artwork URL. */
  image: string;
  title: string;
  subtitle?: string;
  /** Round artwork, for artists. */
  round?: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  /** The item's heart; `token` is its id (`artistId` for an artist). */
  like?: { type: FavoriteType; token: string };
};

/**
 * The top of a detail screen (album, playlist, artist, show): artwork, title
 * and subtitle, then Play, Shuffle and the heart.
 */
export function EntityHeader({
  image,
  title,
  subtitle,
  round = false,
  onPlay,
  onShuffle,
  like,
}: EntityHeaderProps) {
  return (
    <View className="items-center gap-4 px-page pb-4 pt-2">
      <Image
        source={getImageSrc(image, "high")}
        style={{
          width: ENTITY_ART_SIZE,
          height: ENTITY_ART_SIZE,
          borderRadius: round ? ENTITY_ART_SIZE / 2 : radii.lg,
        }}
        transition={150}
        accessibilityIgnoresInvertColors
      />
      <View className="items-center gap-1">
        <Text
          variant="title"
          accessibilityRole="header"
          className="text-center"
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text tone="muted" className="text-center" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="w-full flex-row items-center gap-3">
        <Button
          label="Play"
          icon={{ ios: "play.fill", android: "play_arrow" }}
          onPress={onPlay}
          className="flex-1"
        />
        <Button
          label="Shuffle"
          icon={{ ios: "shuffle", android: "shuffle" }}
          variant="secondary"
          onPress={onShuffle}
          className="flex-1"
        />
        {like ? (
          <LikeButton type={like.type} token={like.token} name={title} />
        ) : null}
      </View>
    </View>
  );
}
