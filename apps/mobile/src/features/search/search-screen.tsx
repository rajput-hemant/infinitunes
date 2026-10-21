import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@infinitunes/core/react/use-debounced-value";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { ChipRow } from "~/components/chip-row";

import { IdleSearch } from "./idle-search";
import { SEARCH_BAR_OPTIONS } from "./search-bar-options";
import { useSearchHistory } from "./search-history";
import { SearchResults } from "./search-results";
import { SEARCH_TYPES } from "./search-types";
import type { SearchType } from "./search-types";

/**
 * Search (iOS's search tab; on Android pushed from the app bar's search
 * action): the native header search bar (the iOS 26 search tab's field,
 * Android's Material search view) drives everything on one screen. An empty
 * field shows recent and top searches; text shows results under the type chips.
 * A `/search?q=` link (Siri, Google Assistant) opens with that query searched.
 */
export function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const searchBar = useRef<SearchBarCommands>(null);
  const [query, setQuery] = useState(q ?? "");
  const [type, setType] = useState<SearchType>("all");
  const { add } = useSearchHistory();
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS, {
    immediate: "",
  });

  /** Puts `text` in the native field and searches it. */
  function searchFor(text: string, nextType: SearchType = type) {
    searchBar.current?.setText(text);
    setQuery(text);
    setType(nextType);
  }

  // A new `?q=` (the tab already open) searches it.
  const [linkedQuery, setLinkedQuery] = useState(q);
  if (q !== linkedQuery) {
    setLinkedQuery(q);
    if (q) setQuery(q);
  }

  // The native field keeps its own text: put the linked query in it.
  useEffect(() => {
    if (q) searchBar.current?.setText(q);
  }, [q]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search",
          headerSearchBarOptions: {
            ...SEARCH_BAR_OPTIONS,
            ref: searchBar,
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            onSearchButtonPress: (event) => add(event.nativeEvent.text),
            onCancelButtonPress: () => setQuery(""),
          },
        }}
      />
      {debouncedQuery ? (
        <SearchResults
          query={debouncedQuery}
          type={type}
          header={
            <ChipRow
              tabs
              chips={SEARCH_TYPES.map((option) => ({
                key: option.type,
                label: option.label,
                selected: option.type === type,
                onPress: () => setType(option.type),
              }))}
            />
          }
          onShowType={setType}
          onOpenResult={() => add(debouncedQuery)}
          onSearchArtist={(name) => searchFor(name, "artist")}
        />
      ) : (
        <IdleSearch
          onSelectRecent={(recent) => {
            searchFor(recent);
            add(recent);
          }}
        />
      )}
    </>
  );
}
