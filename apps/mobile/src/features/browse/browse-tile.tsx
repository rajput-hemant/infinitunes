import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "~/components/ui/text";
import { radii } from "~/theme/tokens";

/** Dark enough for white text in light and dark mode; tiles cycle through them. */
const TILE_COLORS = [
  "#7c3aed",
  "#db2777",
  "#0f766e",
  "#c2410c",
  "#1d4ed8",
  "#15803d",
  "#be123c",
  "#4338ca",
] as const;

export function tileColor(index: number): string {
  return TILE_COLORS[index % TILE_COLORS.length] ?? TILE_COLORS[0];
}

const TILE_HEIGHT = 96;
const ART_SIZE = 72;

type BrowseTileProps = {
  href: Href;
  title: string;
  index: number;
  width: number;
  /** Raw upstream artwork, tucked into the tile's corner. */
  image?: string;
};

/** A coloured category or language tile that opens its list. */
export function BrowseTile({
  href,
  title,
  index,
  width,
  image,
}: BrowseTileProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        className="overflow-hidden p-4 active:opacity-80"
        style={{
          width,
          backgroundColor: tileColor(index),
          height: TILE_HEIGHT,
          borderRadius: radii.md,
        }}
      >
        <Text variant="headline" style={{ color: "#ffffff" }}>
          {title}
        </Text>
        {image ? (
          <View
            className="absolute"
            style={{
              right: -12,
              bottom: -12,
              transform: [{ rotate: "18deg" }],
            }}
          >
            <Image
              source={getImageSrc(image, "medium")}
              style={{
                width: ART_SIZE,
                height: ART_SIZE,
                borderRadius: radii.sm,
              }}
              accessibilityIgnoresInvertColors
            />
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}
