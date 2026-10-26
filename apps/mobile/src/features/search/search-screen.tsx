import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@infinitunes/core/react/use-debounced-value";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { ChipRow } from "~/components/chip-row";
import { single } from "~/lib/params";

import { IdleSearch } from "./idle-search";
import { SearchHeader } from "./search-header";
import { useSearchHistory } from "./search-history";
import { SearchResults } from "./search-results";
import { SEARCH_TYPES } from "./search-types";
import type { SearchType } from "./search-types";

/**
 * The native field's ref. A cold `?q=` link renders before the native field
 * attaches, so the effect finds no field: this ref object also puts the linked
 * query in the field the moment it attaches.
 */
function useSearchField(linked: string | undefined) {
  const field = useRef<SearchBarCommands | null>(null);
  const linkedRef = useRef(linked);
  useEffect(() => {
    linkedRef.current = linked;
  }, [linked]);
  return useMemo(
    () => ({
      get current() {
        return field.current;
      },
      set current(next: SearchBarCommands | null) {
        field.current = next;
        if (next && linkedRef.current) next.setText(linkedRef.current);
      },
    }),
    [],
  );
}

/**
 * Search (the Search tab's root): the search field (`SearchHeader`: iOS's
 * native header field, Android's Material 3 search bar) drives everything on one screen. An empty
 * field shows recent and top searches; text shows results under the type chips.
 * A `/search?q=` link (Siri, Google Assistant) opens with that query searched.
 */
export function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const q = single(params.q);
  const searchBar = useSearchField(q);
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

  // The native field keeps its own text: put a new linked query in it.
  useEffect(() => {
    if (q) searchBar.current?.setText(q);
  }, [q, searchBar]);

  return (
    <>
      <SearchHeader
        query={query}
        fieldRef={searchBar}
        onChangeText={setQuery}
        onSubmit={add}
        onCancel={() => {
          setQuery("");
          setType("all");
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
            searchFor(recent, "all");
            add(recent);
          }}
        />
      )}
    </>
  );
}
