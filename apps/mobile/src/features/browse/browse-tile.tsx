import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable } from "react-native";

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
 * A category or language tile that opens its list: a `fill` tile with the
 * title, and the list's cover at `tile` size inside its end edge, clipped to
 * the tile's corners. It grows with the title at larger text sizes.
 */
export function BrowseTile({ href, title, width, image }: BrowseTileProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={title}
        className="flex-row items-center gap-3 overflow-hidden rounded-md bg-fill active:opacity-70"
        style={{ width, minHeight: art.tile }}
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
  );
}
