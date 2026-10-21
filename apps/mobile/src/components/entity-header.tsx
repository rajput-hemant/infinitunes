import type { FavoriteType } from "@infinitunes/core/favorites";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";

import { useTokenColor } from "~/theme/use-palette";

import { ExplicitBadge } from "./explicit-badge";
import { LikeButton } from "./like-button";
import { Artwork } from "./ui/artwork";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";

/** iOS lifts the header art off the page; Material 3 is flat. */
const ART_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
});

type EntityHeaderProps = {
  /** Raw upstream artwork URL. */
  image: string;
  title: string;
  /** The credit (artists, curator). */
  subtitle?: string;
  /** A second muted line: "17 songs · 1 hr 12 min · 2.4M plays". */
  meta?: string;
  /** The kind and year above the title ("Album · 2023"). */
  eyebrow?: string;
  /** Round artwork, for artists and stations. */
  round?: boolean;
  /** Shows the "E" mark before the title (see `isExplicit`). */
  explicit?: boolean;
  /** An artist's verified seal, beside the eyebrow. */
  verified?: boolean;
  onPlay: () => void;
  /** Leave out for a single track or a station, where shuffling means nothing. */
  onShuffle?: () => void;
  /** The item's heart; `token` is its id (`artistId` for an artist). */
  like?: { type: FavoriteType; token: string };
  /** Controls after the heart, e.g. the collection's `CollectionMenu`. */
  actions?: ReactNode;
};

/**
 * The top of a detail screen (album, playlist, mix, artist, show, station),
 * centred: artwork, the kind and verified marks, the title (after the
 * explicit mark), the credit and a meta line, then Play and Shuffle, and
 * below them the heart and the screen's own actions.
 */
export function EntityHeader({
  image,
  title,
  subtitle,
  meta,
  eyebrow,
  round = false,
  explicit = false,
  verified = false,
  onPlay,
  onShuffle,
  like,
  actions,
}: EntityHeaderProps) {
  const primary = useTokenColor("primary");
  return (
    <View className="items-center px-page pb-4 pt-2">
      {/* The fill gives the iOS shadow an opaque shape to cast from. */}
      <View
        className={`bg-card ${round ? "rounded-full" : "rounded-lg"}`}
        style={ART_SHADOW}
      >
        <Artwork image={image} size="header" round={round} />
      </View>
      {eyebrow || verified ? (
        <View className="mt-4 flex-row items-center gap-2">
          {eyebrow ? (
            <Text variant="caption" tone="muted">
              {eyebrow}
            </Text>
          ) : null}
          {verified ? (
            <View
              accessible
              accessibilityLabel="Verified"
              className="flex-row items-center gap-1"
            >
              <Icon
                name={{ ios: "checkmark.seal.fill", android: "verified" }}
                size="sm"
                color={primary}
              />
              <Text variant="caption" tone="muted">
                Verified
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        className={`flex-row items-center justify-center gap-2 ${
          eyebrow || verified ? "mt-1" : "mt-4"
        }`}
      >
        {explicit ? <ExplicitBadge /> : null}
        <Text
          variant="title1"
          accessibilityRole="header"
          className="shrink text-center"
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          variant="subhead"
          tone="muted"
          className="text-center"
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}
      {meta ? (
        <Text
          variant="footnote"
          tone="muted"
          className="text-center"
          numberOfLines={2}
        >
          {meta}
        </Text>
      ) : null}
      <View className="mt-4 w-full flex-row items-center gap-3">
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
      </View>
      {like || actions ? (
        <View className="mt-2 flex-row items-center justify-center gap-6">
          {like ? (
            <LikeButton type={like.type} token={like.token} name={title} />
          ) : null}
          {actions}
        </View>
      ) : null}
    </View>
  );
}
