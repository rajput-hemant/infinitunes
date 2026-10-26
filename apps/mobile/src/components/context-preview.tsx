import { useWindowDimensions, View } from "react-native";

import { space, textStyles } from "~/theme/tokens";

import { Artwork } from "./ui/artwork";
import { Text, TextInkContext } from "./ui/text";

export type ContextPreviewProps = {
  /** Raw upstream artwork URL. */
  image: string;
  title: string;
  /** The artist, or the kind and year. */
  subtitle?: string;
  /** A song's album. */
  caption?: string;
  /** Round art (artists, stations). */
  round?: boolean;
};

const MAX_WIDTH = 360;
const GAP = space.md;

/**
 * The preview's size, from its content: the window less the page margins (at
 * most 360), square art inside a 16pt inset, then one line per text. iOS sizes
 * the preview from `Link.Preview`'s style, so it is set explicitly.
 */
export function useContextPreviewSize({
  subtitle,
  caption,
}: ContextPreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 2 * space.lg, MAX_WIDTH);
  const edge = width - 2 * space.lg;
  const text =
    textStyles.headline.lineHeight +
    (subtitle ? textStyles.footnote.lineHeight : 0) +
    (caption ? textStyles.footnote.lineHeight : 0);
  return { width, height: 2 * space.lg + edge + GAP + text, edge };
}

/**
 * What a long press previews (Apple Music's): an opaque card with the large
 * rounded artwork, the title, the credit and, for a song, its album. It
 * replaces the destination's live screen, which floated over the page.
 */
export function ContextPreview(props: ContextPreviewProps) {
  const { image, title, subtitle, caption, round } = props;
  const { width, height, edge } = useContextPreviewSize(props);
  return (
    // A row on the player's wash recolours its text; the card has its own surface.
    <TextInkContext value={null}>
      <View
        testID="context-preview"
        className="overflow-hidden rounded-xl bg-card"
        style={{ width, height, padding: space.lg, gap: GAP }}
      >
        <Artwork
          image={image}
          size="header"
          round={round}
          quality="high"
          style={{ width: edge, height: edge }}
        />
        <View>
          <Text variant="headline" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="footnote" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {caption ? (
            <Text variant="footnote" tone="muted" numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </TextInkContext>
  );
}
