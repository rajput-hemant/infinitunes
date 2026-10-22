import type { CardItem, MediaType } from "@infinitunes/types";
import { isExplicit } from "@infinitunes/types";
import { Platform, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { prefetchEntity } from "~/lib/entity-queries";
import { usePressScale } from "~/lib/use-press-scale";
import { entityHref } from "~/navigation/entity-href";
import { isPlayable } from "~/playback/play-entity";
import { art, sizes, space } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import {
  CardLink,
  cardAccessibilityActions,
  useCardMenuEntries,
} from "./card-menu";
import { CardPlayButton } from "./card-play-button";
import { ExplicitBadge } from "./explicit-badge";
import { Artwork } from "./ui/artwork";
import { Text } from "./ui/text";

export type MediaCardVariant = "card" | "hero";

/** A card's title: iOS's semibold footnote, Material's label large (14/500). */
export const CARD_TITLE = Platform.select({
  android: { variant: "label", style: undefined },
  default: { variant: "footnote", style: { fontWeight: "600" } },
} as const);

/** Types whose artwork is round, as on the web. */
const ROUND_TYPES: ReadonlySet<MediaType> = new Set([
  "artist",
  "radio_station",
]);

export function isRoundType(type: MediaType): boolean {
  return ROUND_TYPES.has(type);
}

type MediaCardProps = {
  item: CardItem;
  /** The art's edge; the variant's token (`art.card`, `art.hero`) by default. */
  width?: number;
  /** `hero` (home's featured carousel only): larger art, an eyebrow and a Play button. */
  variant?: MediaCardVariant;
  /** The hero's line above the title ("Featured playlist"). */
  eyebrow?: string;
  /** Runs as the card opens its screen (e.g. search remembers the query). */
  onPress?: () => void;
};

/**
 * An album, playlist, artist, show, station or other catalog item: square
 * artwork (round for artists and stations), title and subtitle. It opens the
 * item's screen; a type without one renders the card without a link. A
 * playable item's long press (and its screen reader actions) offers Play,
 * Play Next and Add to Queue; only the hero variant shows a Play button, a
 * sibling of the link so screen readers reach both.
 */
export function MediaCard({
  item,
  width,
  variant = "card",
  eyebrow,
  onPress,
}: MediaCardProps) {
  const hero = variant === "hero";
  const edge = width ?? (hero ? art.hero : art.card);
  const href = entityHref(item.type, item.url);
  const round = isRoundType(item.type);
  const explicit = isExplicit(item.explicit);
  const name = explicit ? `${item.name}, Explicit` : item.name;
  const shownEyebrow = hero ? eyebrow : undefined;
  // The name first, so a swipe through the carousel hears the title at once.
  const label = [name, item.subtitle, shownEyebrow].filter(Boolean).join(", ");
  const entries = useCardMenuEntries(item);
  const press = usePressScale();
  const ripple = usePalette()["fill-2"];

  const content = (
    <>
      <Animated.View style={press.style}>
        <Artwork
          image={item.image}
          size={hero ? "hero" : "card"}
          round={round}
          style={width === undefined ? undefined : { width, height: width }}
        />
      </Animated.View>
      <View className={round ? "items-center" : undefined}>
        {shownEyebrow ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {shownEyebrow}
          </Text>
        ) : null}
        <Text
          variant={hero ? "headline" : CARD_TITLE.variant}
          numberOfLines={1}
          style={hero ? undefined : CARD_TITLE.style}
        >
          {item.name}
        </Text>
        {item.subtitle || explicit ? (
          <View className="flex-row items-center gap-1">
            {/* The card's label already says "Explicit". */}
            {explicit ? <ExplicitBadge accessible={false} /> : null}
            {item.subtitle ? (
              <Text
                variant={hero ? "footnote" : "caption"}
                style={{ fontWeight: "400" }}
                tone="muted"
                numberOfLines={1}
                className="shrink"
              >
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );

  // A type without a screen is a plain labelled card, not a disabled link.
  if (!href) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        className="gap-2"
        style={{ width: edge }}
      >
        {content}
      </View>
    );
  }

  return (
    <View style={{ width: edge }}>
      <CardLink href={href} name={item.name} entries={entries}>
        {(onLongPress) => (
          <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => {
              press.onPressIn();
              prefetchEntity(item.type, item.url);
            }}
            onPressOut={press.onPressOut}
            accessibilityRole="link"
            accessibilityLabel={label}
            {...cardAccessibilityActions(entries)}
            // Android: a bounded ripple over the card, clipped to its corners.
            android_ripple={{ color: ripple, foreground: true }}
            className="gap-2 overflow-hidden rounded-md"
            style={{ width: edge }}
          >
            {content}
          </Pressable>
        )}
      </CardLink>
      {hero && isPlayable(item.type) ? (
        <CardPlayButton
          type={item.type}
          url={item.url}
          name={item.name}
          style={{
            position: "absolute",
            top: edge - sizes.touch - space.md,
            end: space.md,
          }}
        />
      ) : null}
    </View>
  );
}
