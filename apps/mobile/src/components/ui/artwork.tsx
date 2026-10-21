import { getImageSrc } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";
import { Image } from "expo-image";
import type { ImageStyle } from "expo-image";
import { useWindowDimensions } from "react-native";
import type { StyleProp } from "react-native";

import { usePreferences } from "~/lib/preferences";
import { art, artRadius, playerArtSize, radii } from "~/theme/tokens";
import type { ArtSize } from "~/theme/tokens";

const QUALITY_ORDER: readonly ImageQuality[] = ["low", "medium", "high"];

/** The smaller of what the layout needs and what the listener allows. */
function cappedQuality(wanted: ImageQuality, cap: ImageQuality) {
  return QUALITY_ORDER.indexOf(wanted) <= QUALITY_ORDER.indexOf(cap)
    ? wanted
    : cap;
}

/** 150px covers art up to 64pt on 3x screens; anything larger loads 500px. */
function qualityFor(edge: number): ImageQuality {
  return edge <= art.tile ? "medium" : "high";
}

/** Any radius past half the edge draws a circle, even when `style` resizes the art. */
const FULL_RADIUS = 9999;

/** Edge and radius of a size token; round art is a circle at every size. */
export function artworkFrame(
  size: ArtSize,
  windowWidth: number,
  round = false,
) {
  const edge = size === "player" ? playerArtSize(windowWidth) : art[size];
  const radius = artRadius[size];
  return {
    width: edge,
    height: edge,
    borderRadius: round || radius === "full" ? FULL_RADIUS : radii[radius],
  };
}

type ArtworkProps = {
  /** Raw upstream artwork URL; resized here. */
  image: string;
  /** Sets the edge, the radius and the resolution (`row`, `card`, `header`...). */
  size?: ArtSize;
  /** Round art (artists, stations) at any size. */
  round?: boolean;
  /** Overrides the resolution `size` picks; `high` without a size. */
  quality?: ImageQuality;
  /** Layout only (a margin, a flexible width); merged over the size's frame. */
  style?: StyleProp<ImageStyle>;
  testID?: string;
};

/**
 * Upstream artwork at the layout's resolution, capped by the Image Quality
 * setting. Keyed by its URL so a recycled list cell (FlashList) drops the
 * previous row's picture at once instead of showing it until the new one loads.
 */
export function Artwork({
  image,
  size,
  round = false,
  quality,
  style,
  testID,
}: ArtworkProps) {
  const { width } = useWindowDimensions();
  const cap = usePreferences((preferences) => preferences.imageQuality);
  const frame = size ? artworkFrame(size, width, round) : undefined;
  const wanted = quality ?? (frame ? qualityFor(frame.width) : "high");
  const src = getImageSrc(image, cappedQuality(wanted, cap));
  return (
    <Image
      source={src}
      recyclingKey={src}
      style={[frame, style]}
      testID={testID}
      transition={150}
      accessibilityIgnoresInvertColors
    />
  );
}
