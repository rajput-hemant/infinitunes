import { View } from "react-native";

import { SearchPill } from "~/components/search-pill";
import { Icon } from "~/components/ui/icon";
import { usePalette } from "~/theme/use-palette";

import { FILTER_PLACEHOLDER, type SongFilterProps } from "./song-filter";

const SEARCH = { ios: "magnifyingglass", android: "search" } as const;

/**
 * Android: no field in the app bar (the native one starts after the
 * toolbar's 72dp title inset); the list leads with the filter instead.
 */
export function FilterHeader(_: SongFilterProps) {
  return null;
}

/** Android: Material 3's search bar at the top of the list, controlled by `query`. */
export function FilterField({ query, onChangeText }: SongFilterProps) {
  const palette = usePalette();
  return (
    <View className="px-page py-2">
      <SearchPill
        value={query}
        onChangeText={onChangeText}
        editable={onChangeText !== undefined}
        label="Filter songs"
        placeholder={FILTER_PLACEHOLDER}
        autoCapitalize="none"
        returnKeyType="search"
        onClear={onChangeText && (() => onChangeText(""))}
        clearLabel="Clear filter"
        leading={
          <View
            importantForAccessibility="no-hide-descendants"
            className="size-touch items-center justify-center"
          >
            <Icon name={SEARCH} color={palette["muted-foreground"]} />
          </View>
        }
      />
    </View>
  );
}
