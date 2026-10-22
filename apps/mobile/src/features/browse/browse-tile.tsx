import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Platform, Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { Artwork } from "~/components/ui/artwork";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { usePressScale } from "~/lib/use-press-scale";
import { art } from "~/theme/tokens";

type BrowseTileProps = {
  href: Href;
  title: string;
  width: number;
  /** Raw upstream artwork: the list's first cover, flush at the end edge. */
  image?: string;
};

/**
 * A category or language tile that opens its list: a `fill` tile with the
 * title, and the list's cover at `tile` size inside its end edge, clipped to
 * the tile's corners. It grows with the title at larger text sizes and sinks
 * under the finger like a quick pick.
 */
export function BrowseTile({ href, title, width, image }: BrowseTileProps) {
  const press = usePressScale(0.97);
  return (
    <Animated.View style={[{ width }, press.style]}>
      <Link href={href} asChild>
        <Pressable
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="link"
          accessibilityLabel={title}
          className={cx(
            "flex-row items-center gap-3 overflow-hidden rounded-md active:opacity-80",
            // Material tiles sit on a tonal surface container, as quick picks do.
            Platform.OS === "android" ? "bg-card" : "bg-fill",
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
        </Pressable>
      </Link>
    </Animated.View>
  );
}
