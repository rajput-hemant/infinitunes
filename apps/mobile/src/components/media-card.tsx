import type { CardItem, MediaType } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { entityHref } from "~/navigation/entity-href";
import { radii } from "~/theme/tokens";

import { Text } from "./ui/text";

/** Card width in points: two and a bit cards fill a phone's width, hinting the shelf scrolls. */
export const MEDIA_CARD_WIDTH = 150;

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
 * item's screen; a type without one renders the card without a link.
 */
export function MediaCard({
  item,
  width = MEDIA_CARD_WIDTH,
  onPress,
}: MediaCardProps) {
  const href = entityHref(item.type, item.url);
  const round = ROUND_TYPES.has(item.type);
  const card = (
    <Pressable
      disabled={!href}
      onPress={onPress}
      accessibilityRole={href ? "link" : undefined}
      accessibilityLabel={
        item.subtitle ? `${item.name}, ${item.subtitle}` : item.name
      }
      className="gap-1.5 active:opacity-70"
      style={{ width }}
    >
      <Image
        source={getImageSrc(item.image, "high")}
        style={{
          width,
          height: width,
          borderRadius: round ? width / 2 : radii.md,
        }}
        transition={150}
        accessibilityIgnoresInvertColors
      />
      <View className={round ? "items-center" : undefined}>
        <Text variant="subhead" numberOfLines={1}>
          {item.name}
        </Text>
        {item.subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return href ? (
    <Link href={href} asChild>
      {card}
    </Link>
  ) : (
    card
  );
}
