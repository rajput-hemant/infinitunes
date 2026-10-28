import { getImageSrc } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";
import { Image } from "expo-image";
import type { ImageStyle } from "expo-image";
import {
  PixelRatio,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { usePreferences } from "~/lib/preferences";
import { art, artRadius, playerArtSize, radii } from "~/theme/tokens";
import type { ArtSize } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { Icon } from "./icon";

/** Upstream's stock pictures (`/_i/3.0/artist-default-music.png`): a grey camera or mic. */
const STOCK_IMAGE = /\/_i\/[\d.]+\/[^/]*default/;

const QUALITY_ORDER: readonly ImageQuality[] = ["low", "medium", "high"];

/** The smaller of what the layout needs and what the listener allows. */
function cappedQuality(wanted: ImageQuality, cap: ImageQuality) {
  return QUALITY_ORDER.indexOf(wanted) <= QUALITY_ORDER.indexOf(cap)
    ? wanted
    : cap;
}

/** The pixels of the `medium` (150px) picture. */
const MEDIUM_PX = 150;

/**
 * `medium` while the 150px picture covers the art's physical pixels (a 48pt
 * row on a 3x screen is 144px), else `high` (500px): a 56pt tile on a 2.8x
 * Samsung is 158px, where 150px is already visibly soft.
 */
function qualityFor(edge: number): ImageQuality {
  return PixelRatio.getPixelSizeForLayoutSize(edge) <= MEDIUM_PX
    ? "medium"
    : "high";
}

/** Any radius past half the edge draws a circle, even when `style` resizes the art. */
export const FULL_RADIUS = 9999;

/** Edge and radius of a size token; round art is a circle at every size. */
export function artworkFrame(
  size: ArtSize,
  windowWidth: number,
  round = false,
  scale: Record<keyof typeof radii, number> = radii,
) {
  const edge = size === "player" ? playerArtSize(windowWidth) : art[size];
  const radius = artRadius[size];
  return {
    width: edge,
    height: edge,
    borderRadius: round || radius === "full" ? FULL_RADIUS : scale[radius],
  };
}

type ArtworkProps = {
  /** Raw upstream artwork URL; resized here. */
  image: string;
  /** Sets the edge, the radius and the resolution (`row`, `card`, `header`...). */
  size: ArtSize;
  /** Round art (artists, stations) at any size. */
  round?: boolean;
  /** Overrides the resolution `size` picks. */
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
export function Artwork(props: ArtworkProps) {
  return props.size === "player" ? (
    <ResponsiveArtwork {...props} />
  ) : (
    <ArtworkImage {...props} windowWidth={0} />
  );
}

function ResponsiveArtwork(props: ArtworkProps) {
  const { width } = useWindowDimensions();
  return <ArtworkImage {...props} windowWidth={width} />;
}

function ArtworkImage({
  image,
  size,
  round = false,
  quality,
  style,
  testID,
  windowWidth,
}: ArtworkProps & { windowWidth: number }) {
  const scale = useRadii();
  const cap = usePreferences((preferences) => preferences.imageQuality);
  const frame = artworkFrame(size, windowWidth, round, scale);
  const wanted = quality ?? qualityFor(frame.width);
  const src = getImageSrc(image, cappedQuality(wanted, cap));
  if (!image || STOCK_IMAGE.test(image)) {
    return (
      <Placeholder
        round={round}
        style={StyleSheet.flatten([frame, style]) as ViewStyle}
        testID={testID}
      />
    );
  }
  return (
    <Image
      source={src}
      recyclingKey={src}
      style={[frame, style]}
      testID={testID}
      // Recycled list cells (rows, cards) swap their picture at once.
      transition={size === "row" || size === "card" ? 0 : 150}
      accessibilityIgnoresInvertColors
    />
  );
}

/** No picture of its own: a person (artists, stations) or a note on the fill. */
function Placeholder({
  round,
  style,
  testID,
}: {
  round: boolean;
  style: ViewStyle;
  testID?: string;
}) {
  const palette = usePalette();
  const edge = typeof style.width === "number" ? style.width : art.row;
  return (
    <View
      testID={testID}
      className="items-center justify-center bg-fill-2"
      style={style}
    >
      <Icon
        name={
          round
            ? { ios: "person.fill", android: "person" }
            : { ios: "music.note", android: "music_note" }
        }
        size={edge >= art.card ? "xl" : edge >= art.row ? "lg" : "md"}
        color={palette["muted-foreground"]}
      />
    </View>
  );
}
