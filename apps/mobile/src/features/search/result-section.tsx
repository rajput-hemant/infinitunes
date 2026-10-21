import type { SearchItem } from "@infinitunes/types";
import { Pressable, View } from "react-native";

import { TEXT_BUTTON_HIT_SLOP } from "~/components/ui/hit-slop";
import { Text } from "~/components/ui/text";

import { ResultRow } from "./result-row";

type ResultSectionProps = {
  title: string;
  items: readonly SearchItem[];
  onPressItem: (item: SearchItem) => void;
  /** Switches to the full list of this kind. */
  onSeeAll?: () => void;
};

/** A titled group of result rows, like a `Shelf` heading without a route to link to. Empty groups render nothing. */
export function ResultSection({
  title,
  items,
  onPressItem,
  onSeeAll,
}: ResultSectionProps) {
  if (items.length === 0) return null;

  return (
    <View className="py-3">
      <View className="flex-row items-center justify-between px-page pb-1">
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
            hitSlop={TEXT_BUTTON_HIT_SLOP}
          >
            <Text variant="subhead" tone="muted">
              See All
            </Text>
          </Pressable>
        ) : null}
      </View>
      {items.map((item) => (
        <ResultRow key={item.id} item={item} onPress={onPressItem} />
      ))}
    </View>
  );
}
