import type { FavoriteType } from "@infinitunes/core/favorites";
import type { ReactNode } from "react";
import { View } from "react-native";

import { radii } from "~/theme/tokens";

import { LikeButton } from "./like-button";
import { Artwork } from "./ui/artwork";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

/** Artwork edge in points: the detail screen's focal point, about half a phone's width. */
export const ENTITY_ART_SIZE = 220;

type EntityHeaderProps = {
  /** Raw upstream artwork URL. */
  image: string;
  title: string;
  subtitle?: string;
  /** A kind label above the title ("Radio station"). */
  eyebrow?: string;
  /** Round artwork, for artists and stations. */
  round?: boolean;
  onPlay: () => void;
  /** Leave out for a single track or a station, where shuffling means nothing. */
  onShuffle?: () => void;
  /** The item's heart; `token` is its id (`artistId` for an artist). */
  like?: { type: FavoriteType; token: string };
  /** Trailing controls after the heart, e.g. the collection's `CollectionMenu`. */
  actions?: ReactNode;
};

/**
 * The top of a detail screen (album, playlist, artist, show, station):
 * artwork, title and subtitle, then Play, Shuffle, the heart and the
 * screen's own actions.
 */
export function EntityHeader({
  image,
  title,
  subtitle,
  eyebrow,
  round = false,
  onPlay,
  onShuffle,
  like,
  actions,
}: EntityHeaderProps) {
  return (
    <View className="items-center gap-4 px-page pb-4 pt-2">
      <Artwork
        image={image}
        quality="high"
        style={{
          width: ENTITY_ART_SIZE,
          height: ENTITY_ART_SIZE,
          borderRadius: round ? ENTITY_ART_SIZE / 2 : radii.lg,
        }}
      />
      <View className="items-center gap-1">
        {eyebrow ? (
          <Text variant="caption" tone="muted">
            {eyebrow}
          </Text>
        ) : null}
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
        {onShuffle ? (
          <Button
            label="Shuffle"
            icon={{ ios: "shuffle", android: "shuffle" }}
            variant="secondary"
            onPress={onShuffle}
            className="flex-1"
          />
        ) : null}
        {like ? (
          <LikeButton type={like.type} token={like.token} name={title} />
        ) : null}
        {actions}
      </View>
    </View>
  );
}
