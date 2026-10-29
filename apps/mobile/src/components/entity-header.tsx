import type { FavoriteType } from "@infinitunes/core/favorites";
import { Platform, Pressable, useColorScheme, View } from "react-native";

import { OnWash, nowPlayingWash } from "~/components/wash";
import { usePlayerColors } from "~/lib/use-player-colors";
import { artShadow, translucentFill } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

import type { CollectionMenuSpec } from "./collection-menu";
import { DetailMenu } from "./detail/detail-menu";
import { DownloadButton } from "./download-button";
import { ExplicitBadge } from "./explicit-badge";
import { Artwork } from "./ui/artwork";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { Text } from "./ui/text";

/** iOS lifts the header art off the page, as Apple Music does; Material 3 is flat. */
const ART_SHADOW = Platform.select({
  ios: {
    shadowColor: artShadow.color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: artShadow.opacity,
    shadowRadius: 20,
  },
});

/** The title's role: large and bold on both platforms, wrapping (never cut). `EntityHeaderSkeleton` reserves a line. */
export const ENTITY_TITLE_VARIANT: TextVariant = "title1";

/**
 * How far the artwork wash runs up behind the bar (Android's transparent bar
 * and the status bar above it) and the overscroll, so the tint meets the top
 * of the screen. The page's list clips nothing above it.
 */
const WASH_BLEED = 400;

type EntityHeaderProps = {
  /** Raw upstream artwork URL. */
  image: string;
  title: string;
  /** The credit (artists, curator). */
  subtitle?: string;
  /** Makes the credit a link (a single artist's screen); it then reads as one. */
  onSubtitlePress?: () => void;
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
  like?: { type: FavoriteType; token: string; linkToken?: string };
  /**
   * The collection's "more" menu. It lives in the native header bar next to
   * Share (see `DetailMenu`), not in this header's action row.
   */
  menu?: Omit<CollectionMenuSpec, "name">;
};

/**
 * The top of a detail screen (album, playlist, mix, artist, show, station),
 * centred and at most `sizes.readable` wide, Apple Music's layout: artwork
 * over a wash of its own colour, the kind and verified marks, the title (after
 * the explicit mark), the credit and a meta line, then one row: Shuffle and
 * the heart as round tonal buttons either side of a wide Play capsule. The
 * page's "more" menu is in the bar, beside Share. With no readable artwork
 * colour the page keeps its plain background.
 */
export function EntityHeader({
  image,
  title,
  subtitle,
  onSubtitlePress,
  meta,
  eyebrow,
  round = false,
  explicit = false,
  verified = false,
  onPlay,
  onShuffle,
  like,
  menu,
}: EntityHeaderProps) {
  const primary = useTokenColor("primary");
  const colors = usePlayerColors(image);
  const wash = colors?.wash[0];
  const { background } = usePalette();
  // Android ends on the page colour the bar scrim fades in; iOS's page is a
  // UIKit system colour, so it keeps fading to clear.
  const washEnd = Platform.OS === "android" ? background : `${wash}00`;
  const glass = translucentFill[useColorScheme() === "dark" ? "dark" : "light"];
  const songs = (menu?.rows ?? []).filter((row) => row.type === "song");
  return (
    <OnWash colors={colors ? nowPlayingWash(colors) : null}>
      <View className="w-full">
        {wash ? (
          <View
            pointerEvents="none"
            testID="header-wash"
            style={{
              position: "absolute",
              top: -WASH_BLEED,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(180deg, ${wash} ${WASH_BLEED}px, ${washEnd} 100%)`,
            }}
          />
        ) : null}
        {menu || like ? (
          <DetailMenu name={title} like={like} {...menu} />
        ) : null}
        <View className="w-full max-w-readable items-center self-center px-page pb-6 pt-2">
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
              variant={ENTITY_TITLE_VARIANT}
              emphasized
              accessibilityRole="header"
              className="shrink text-center"
            >
              {title}
            </Text>
          </View>
          {subtitle ? (
            onSubtitlePress ? (
              <Pressable
                onPress={onSubtitlePress}
                accessibilityRole="link"
                accessibilityLabel={subtitle}
                hitSlop={8}
                className="min-h-touch justify-center active:opacity-60"
              >
                <Text
                  variant="subhead"
                  tone="primary"
                  emphasized
                  className="text-center underline"
                >
                  {subtitle}
                </Text>
              </Pressable>
            ) : (
              <Text variant="subhead" className="text-center">
                {subtitle}
              </Text>
            )
          ) : null}
          {meta ? (
            <Text variant="footnote" tone="muted" className="text-center">
              {meta}
            </Text>
          ) : null}
          {/* Shuffle and Download are equal round buttons on a translucent
              fill (the wash shows through) around the solid Play capsule. */}
          <View className="mt-6 flex-row items-center justify-center gap-3">
            {onShuffle ? (
              <IconButton
                icon={{ ios: "shuffle", android: "shuffle" }}
                label="Shuffle"
                variant="tonal"
                fill={glass}
                onPress={onShuffle}
              />
            ) : null}
            <Button
              label="Play"
              icon={{ ios: "play.fill", android: "play_arrow" }}
              roomy
              onPress={onPlay}
            />
            {songs.length > 0 ? (
              <DownloadButton title={title} songs={songs} fill={glass} />
            ) : null}
          </View>
        </View>
      </View>
    </OnWash>
  );
}
