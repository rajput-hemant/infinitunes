import type { Href } from "expo-router";
import { Platform } from "react-native";

import { PressableTile } from "~/components/pressable-tile";
import { Artwork } from "~/components/ui/artwork";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { art } from "~/theme/tokens";

type BrowseTileProps = {
  href: Href;
  title: string;
  width: number;
  /** Raw upstream artwork: the list's first cover, flush at the end edge. */
  image?: string;
};

/**
 * A category or language tile that opens its list: a `fill` (iOS) or outlined (Android) tile with the
 * title, and the list's cover at `tile` size inside its end edge, clipped to
 * the tile's corners. It grows with the title at larger text sizes and sinks
 * under the finger like a quick pick.
 */
export function BrowseTile({ href, title, width, image }: BrowseTileProps) {
  return (
    <PressableTile
      width={width}
      href={href}
      accessibilityLabel={title}
      className={cx(
        "flex-row items-center gap-3 overflow-hidden active:opacity-80",
        // Android: an ink tile at the card shape (an `outlineVariant` hairline, no tonal box).
        Platform.OS === "android"
          ? "rounded-lg border border-border"
          : "rounded-md bg-fill",
      )}
      style={{ minHeight: art.tile }}
    >
      <Text
        variant="headline"
        numberOfLines={2}
        className={cx("flex-1 py-3 pl-3", !image && "pr-3")}
      >
        {title}
      </Text>
      {image ? (
        // Flush art takes the tile's corners (the tile clips it).
        <Artwork image={image} size="tile" style={{ borderRadius: 0 }} />
      ) : null}
    </PressableTile>
  );
}
