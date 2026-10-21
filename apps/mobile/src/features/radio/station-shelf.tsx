import type { CardItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "~/components/ui/text";
import { sizes } from "~/theme/tokens";

import { StationCard } from "./station-card";

const CARD_GAP = 12;

type StationShelfProps = {
  title: string;
  items: readonly CardItem[];
  seeAllHref?: Href;
};

function CardGap() {
  return <View style={{ width: CARD_GAP }} />;
}

/** `Shelf` for radio stations, whose cards play and open their own screen. */
export function StationShelf({ title, items, seeAllHref }: StationShelfProps) {
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
        renderItem={({ item }) => <StationCard item={item} />}
        ItemSeparatorComponent={CardGap}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sizes.page }}
      />
    </View>
  );
}
