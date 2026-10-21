import type { CardItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { sizes } from "~/theme/tokens";

import { MediaCard } from "./media-card";
import { Text } from "./ui/text";

const CARD_GAP = 12;

type ShelfProps = {
  title: string;
  items: readonly CardItem[];
  /** The full list's screen; shows a "See All" link in the heading. */
  seeAllHref?: Href;
};

function CardGap() {
  return <View style={{ width: CARD_GAP }} />;
}

/** A titled, horizontally scrolling row of media cards. Renders nothing when empty. */
export function Shelf({ title, items, seeAllHref }: ShelfProps) {
  if (items.length === 0) return null;

  return (
    <View className="gap-2 py-3">
      <View className="flex-row items-center justify-between px-page">
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {seeAllHref ? (
          <Link href={seeAllHref} asChild>
            <Pressable accessibilityRole="link" hitSlop={10}>
              <Text variant="subhead" tone="muted">
                See All
              </Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
      <FlashList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MediaCard item={item} />}
        ItemSeparatorComponent={CardGap}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sizes.page }}
      />
    </View>
  );
}
