import type { CardItem, MediaType } from "@infinitunes/types";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { entityHref } from "~/navigation/entity-href";
import { isPlayable } from "~/playback/play-entity";
import { radii, sizes } from "~/theme/tokens";

import { CardPlayButton } from "./card-play-button";
import { ExplicitBadge, isExplicit } from "./explicit-badge";
import { Artwork } from "./ui/artwork";
import { Text } from "./ui/text";

/** Card width in points: two and a bit cards fill a phone's width, hinting the shelf scrolls. */
export const MEDIA_CARD_WIDTH = 150;

/** Distance of the play button from the artwork's bottom-right corner. */
const PLAY_INSET = 4;

/** Types whose artwork is round, as on the web. */
const ROUND_TYPES: ReadonlySet<MediaType> = new Set([
  "artist",
  "radio_station",
]);

type MediaCardProps = {
  item: CardItem;
  width?: number;
  /** Runs as the card opens its screen (e.g. search remembers the query). */
  onPress?: () => void;
};

/**
 * An album, playlist, artist, show, station or other catalog item: square
 * artwork (round for artists and stations), title and subtitle. It opens the
 * item's screen; a type without one renders the card without a link. A
 * playable item gets a Play button over its artwork (the web's `CardPlay`),
 * a sibling of the link so screen readers reach both.
 */
export function MediaCard({
  item,
  width = MEDIA_CARD_WIDTH,
  onPress,
}: MediaCardProps) {
  const href = entityHref(item.type, item.url);
  const round = ROUND_TYPES.has(item.type);
  const explicit = isExplicit(item.explicit);
  const name = explicit ? `${item.name}, Explicit` : item.name;
  const card = (
    <Pressable
      disabled={!href}
      onPress={onPress}
      accessibilityRole={href ? "link" : undefined}
      accessibilityLabel={item.subtitle ? `${name}, ${item.subtitle}` : name}
      className="gap-1.5 active:opacity-70"
      style={{ width }}
    >
      <Artwork
        image={item.image}
        quality="high"
        style={{
          width,
          height: width,
          borderRadius: round ? width / 2 : radii.md,
        }}
      />
      <View className={round ? "items-center" : undefined}>
        <View className="flex-row items-center gap-1">
          {explicit ? <ExplicitBadge /> : null}
          <Text variant="subhead" numberOfLines={1} className="shrink">
            {item.name}
          </Text>
        </View>
        {item.subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  if (!href) return card;
  const linked = (
    <Link href={href} asChild>
      {card}
    </Link>
  );
  if (!isPlayable(item.type)) return linked;
  return (
    <View style={{ width }}>
      {linked}
      <CardPlayButton
        type={item.type}
        url={item.url}
        name={item.name}
        style={{
          position: "absolute",
          top: width - sizes.ctl - PLAY_INSET,
          left: width - sizes.ctl - PLAY_INSET,
        }}
      />
    </View>
  );
}
