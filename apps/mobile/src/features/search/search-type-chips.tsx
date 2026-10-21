import { Pressable, ScrollView } from "react-native";

import { CHIP_HIT_SLOP } from "~/components/chip-row";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";

import { SEARCH_TYPES } from "./search-types";
import type { SearchType } from "./search-types";

type SearchTypeChipsProps = {
  type: SearchType;
  onChange: (type: SearchType) => void;
};

/** The result filters as a scrolling row of chips (the web's type navbar). */
export function SearchTypeChips({ type, onChange }: SearchTypeChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-2 px-page py-2"
      accessibilityRole="tablist"
    >
      {SEARCH_TYPES.map((option) => {
        const selected = option.type === type;
        return (
          <Pressable
            key={option.type}
            onPress={() => onChange(option.type)}
            hitSlop={CHIP_HIT_SLOP}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cx(
              "min-h-ctl items-center justify-center rounded-full px-4 py-1 active:opacity-70",
              selected ? "bg-primary" : "bg-fill-2",
            )}
          >
            <Text variant="subhead" tone={selected ? "onPrimary" : "default"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
