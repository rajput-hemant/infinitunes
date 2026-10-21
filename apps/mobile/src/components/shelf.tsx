import { uniqueBy } from "@infinitunes/types";
import type { CardItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import type { Href } from "expo-router";
import { View } from "react-native";

import { sizes, space } from "~/theme/tokens";

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
};

function CardGap() {
  return <View style={{ width: space.md }} />;
}

/**
 * A `SectionHeader` over a horizontally scrolling row of media cards; the
 * list carries the page gutter, the shelf no vertical padding. Renders
 * nothing when empty.
 */
export function Shelf({
  title,
  items,
  seeAllHref,
  onItemPress,
  variant = "card",
}: ShelfProps) {
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
        // Upstream modules can repeat an item; FlashList needs unique keys.
        data={uniqueBy(items, (item) => item.id)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MediaCard
            item={item}
            variant={variant}
            onPress={onItemPress && (() => onItemPress(item))}
          />
        )}
        ItemSeparatorComponent={CardGap}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sizes.page }}
      />
    </View>
  );
}
