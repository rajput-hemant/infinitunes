import { uniqueBy } from "@infinitunes/types";
import type { CardItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import type { Href } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";

import { art, playerArtSize, sizes, space } from "~/theme/tokens";

import { MediaCard } from "./media-card";
import type { MediaCardVariant } from "./media-card";
import { SectionHeader } from "./section-header";

type ShelfProps = {
  /** The section's header; leave out for an untitled row (home's featured carousel). */
  title?: string;
  items: readonly CardItem[];
  /** The full list's screen; shows a "See All" link in the header. */
  seeAllHref?: Href;
  /** Runs as a card opens its screen. */
  onItemPress?: (item: CardItem) => void;
  /** `hero` cards for the featured carousel; `card` everywhere else. */
  variant?: MediaCardVariant;
  /** A hero card's line above its title ("Featured playlist"); cards show none. */
  eyebrow?: (item: CardItem) => string | undefined;
};

/** How much of the next hero card shows past the current one (M3 hero carousel's small item). */
const HERO_PEEK = art.tile;
const cardKey = (item: CardItem) => item.id;

/**
 * The hero card's edge: the window less the gutter, the gap and a peek of the
 * next card, capped like Now Playing's art so a tablet's hero stays a card.
 */
export function useHeroWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(
    width - 2 * sizes.page - space.md - HERO_PEEK,
    playerArtSize(width),
  );
}

function CardGap() {
  return <View style={{ width: space.md }} />;
}

/**
 * A `SectionHeader` over a horizontally scrolling row of media cards; the
 * list carries the page gutter, the shelf no vertical padding. Renders
 * nothing when empty. The `hero` variant is Material's hero carousel: one
 * large card with a peek of the next, snapping per card.
 */
export const Shelf = memo(function Shelf({
  title,
  items,
  seeAllHref,
  onItemPress,
  variant = "card",
  eyebrow,
}: ShelfProps) {
  const heroWidth = useHeroWidth();
  // Upstream modules can repeat an item; FlashList needs unique keys.
  const unique = useMemo(() => uniqueBy(items, (item) => item.id), [items]);
  const hero = variant === "hero";
  const renderItem = useCallback(
    ({ item }: { item: CardItem }) => (
      <MediaCard
        item={item}
        variant={variant}
        width={hero ? heroWidth : undefined}
        eyebrow={eyebrow?.(item)}
        onPress={onItemPress && (() => onItemPress(item))}
      />
    ),
    [eyebrow, hero, heroWidth, onItemPress, variant],
  );
  if (items.length === 0) return null;

  return (
    <View>
      {title ? (
        <SectionHeader
          title={title}
          action={
            seeAllHref
              ? {
                  label: "See All",
                  href: seeAllHref,
                  accessibilityLabel: `See all ${title}`,
                }
              : undefined
          }
        />
      ) : null}
      <FlashList
        horizontal
        data={unique}
        keyExtractor={cardKey}
        renderItem={renderItem}
        ItemSeparatorComponent={CardGap}
        showsHorizontalScrollIndicator={false}
        // The hero carousel settles one card at a time, its start on the gutter.
        snapToInterval={hero ? heroWidth + space.md : undefined}
        decelerationRate={hero ? "fast" : undefined}
        contentContainerStyle={{ paddingHorizontal: sizes.page }}
      />
    </View>
  );
});
