import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { View } from "react-native";

import { radii, sizes } from "~/theme/tokens";

import { Text } from "./ui/text";

type MediaRowProps = {
  title: string;
  subtitle?: string;
  /** Raw upstream artwork URL; resized for a row here. */
  image: string;
};

/** 150px artwork covers the 44pt row thumbnail up to 3x screens. */
const ARTWORK_QUALITY = "medium";

/** One list row: artwork, title and an optional subtitle. */
export function MediaRow({ title, subtitle, image }: MediaRowProps) {
  return (
    <View className="h-row flex-row items-center gap-3 px-page">
      <Image
        source={getImageSrc(image, ARTWORK_QUALITY)}
        style={{ width: sizes.art, height: sizes.art, borderRadius: radii.sm }}
        transition={150}
        accessibilityIgnoresInvertColors
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
}
