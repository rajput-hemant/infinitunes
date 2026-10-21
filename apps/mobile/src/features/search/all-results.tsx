import { decode, toCardItem } from "@infinitunes/types";
import type { AllSearch } from "@infinitunes/types";
import type { ReactElement } from "react";

import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Shelf } from "~/components/shelf";
import { ShelfSkeleton, SongListSkeleton } from "~/components/skeletons";
import { useOpenEntity } from "~/navigation/use-open-entity";

import { NoResults } from "./no-results";
import { ResultSection } from "./result-section";
import { getSearchItems, isLinked } from "./search-items";
import type { SearchItem } from "./search-items";
import type { ListSearchType } from "./search-types";
import { useAllSearch } from "./use-all-search";

/** Rows shown per group before "See All" switches to the full list. */
const PREVIEW_ROWS = 4;

type AllResultsProps = {
  query: string;
  /** The type chips, rendered above the results. */
  header: ReactElement;
  onShowType: (type: ListSearchType) => void;
  /** Items without a screen of their own (artists) open that name's artist results. */
  onSearchArtist: (name: string) => void;
};

function shelfItems(data: AllSearch, key: "albums" | "playlists" | "shows") {
  return getSearchItems(data[key]).filter(isLinked).map(toCardItem);
}

/** The combined search: top result, a few songs and artists, then a shelf per catalog type. */
export function AllResults({
  query,
  header,
  onShowType,
  onSearchArtist,
}: AllResultsProps) {
  const openEntity = useOpenEntity();
  const { state, retry } = useAllSearch(query);

  function open(item: SearchItem) {
    if (isLinked(item)) openEntity(item.type, item.perma_url);
    else onSearchArtist(decode(item.title));
  }

  return (
    <ScreenScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {header}
      {state.status === "loading" ? (
        <>
          <SongListSkeleton rows={4} />
          <ShelfSkeleton />
        </>
      ) : null}
      {state.status === "error" ? (
        <ErrorState error={state.error} onRetry={retry} />
      ) : null}
      {state.status === "empty" ? <NoResults query={query} /> : null}
      {state.status === "ready" ? (
        <>
          <ResultSection
            title="Top Result"
            items={[state.top]}
            onPressItem={open}
          />
          <ResultSection
            title="Songs"
            items={getSearchItems(state.data.songs).slice(0, PREVIEW_ROWS)}
            onPressItem={open}
            onSeeAll={() => onShowType("song")}
          />
          <ResultSection
            title="Artists"
            items={getSearchItems(state.data.artists).slice(0, PREVIEW_ROWS)}
            onPressItem={open}
            onSeeAll={() => onShowType("artist")}
          />
          <Shelf title="Albums" items={shelfItems(state.data, "albums")} />
          <Shelf
            title="Playlists"
            items={shelfItems(state.data, "playlists")}
          />
          <Shelf title="Podcasts" items={shelfItems(state.data, "shows")} />
        </>
      ) : null}
    </ScreenScrollView>
  );
}
