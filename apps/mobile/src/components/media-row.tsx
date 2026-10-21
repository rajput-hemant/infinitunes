import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { radii, sizes } from "~/theme/tokens";

import { Artwork } from "./ui/artwork";
import { Text } from "./ui/text";

type MediaRowProps = {
  title: string;
  subtitle?: string;
  /** Raw upstream artwork URL; resized for a row here. */
  image: string;
  /** The item's screen: the row is a link to it. */
  href?: Href;
  /** What a tap does instead, when the row is not a link. */
  onPress?: () => void;
};

/** 150px artwork covers the 44pt row thumbnail up to 3x screens. */
const ARTWORK_QUALITY = "medium";

/** One list row: artwork, title and an optional subtitle; a link or a button when given one. */
export function MediaRow({
  title,
  subtitle,
  image,
  href,
  onPress,
}: MediaRowProps) {
  const row = (
    <View className="min-h-row flex-row items-center gap-3 px-page py-1">
      <Artwork
        image={image}
        quality={ARTWORK_QUALITY}
        style={{ width: sizes.art, height: sizes.art, borderRadius: radii.sm }}
      />
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
  if (!href && !onPress) return row;

  const pressable = (
    <Pressable
      onPress={onPress}
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      className="active:opacity-70"
    >
      {row}
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {pressable}
    </Link>
  ) : (
    pressable
  );
}
