import type { SearchItem } from "@infinitunes/types";
import { View } from "react-native";

import { SectionHeader } from "~/components/section-header";

import { ResultRow } from "./result-row";

type ResultSectionProps = {
  title: string;
  items: readonly SearchItem[];
  onPressItem: (item: SearchItem) => void;
  /** Switches to the full list of this kind. */
  onSeeAll?: () => void;
};

/** A titled group of result rows; "See All" switches to the type's list. Empty groups render nothing. */
export function ResultSection({
  title,
  items,
  onPressItem,
  onSeeAll,
}: ResultSectionProps) {
  if (items.length === 0) return null;

  return (
    <View>
      <SectionHeader
        title={title}
        action={
          onSeeAll
            ? {
                label: "See All",
                onPress: onSeeAll,
                accessibilityLabel: `See all ${title}`,
              }
            : undefined
        }
      />
      {items.map((item) => (
        <ResultRow key={item.id} item={item} onPress={onPressItem} />
      ))}
    </View>
  );
}
