import { getImageSrc } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";
import { Image } from "expo-image";
import type { ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

import { usePreferences } from "~/lib/preferences";

const QUALITY_ORDER: readonly ImageQuality[] = ["low", "medium", "high"];

/** The smaller of what the layout needs and what the listener allows. */
function cappedQuality(wanted: ImageQuality, cap: ImageQuality) {
  return QUALITY_ORDER.indexOf(wanted) <= QUALITY_ORDER.indexOf(cap)
    ? wanted
    : cap;
}

type ArtworkProps = {
  /** Raw upstream artwork URL; resized here. */
  image: string;
  /** The resolution the layout needs: `medium` for rows, `high` for cards and headers. */
  quality: ImageQuality;
  style: StyleProp<ImageStyle>;
  testID?: string;
};

/** Upstream artwork at the layout's resolution, capped by the Image Quality setting. */
export function Artwork({ image, quality, style, testID }: ArtworkProps) {
  const cap = usePreferences((preferences) => preferences.imageQuality);
  return (
    <Image
      source={getImageSrc(image, cappedQuality(quality, cap))}
      style={style}
      testID={testID}
      transition={150}
      accessibilityIgnoresInvertColors
    />
  );
}
