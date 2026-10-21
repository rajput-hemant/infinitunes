import type { CardItem } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { entityHref } from "~/navigation/entity-href";
import { radii } from "~/theme/tokens";

import { Text } from "./ui/text";

/** Card width in points: two and a bit cards fill a phone's width, hinting the shelf scrolls. */
export const MEDIA_CARD_WIDTH = 150;

type MediaCardProps = {
  item: CardItem;
  width?: number;
};

/**
 * An album, playlist, artist, show or other catalog item: square artwork
 * (round for artists), title and subtitle. It opens the item's screen; a type
 * without one renders the card without a link.
 */
export function MediaCard({ item, width = MEDIA_CARD_WIDTH }: MediaCardProps) {
  const href = entityHref(item.type, item.url);
  const round = item.type === "artist";
  const card = (
    <Pressable
      disabled={!href}
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
