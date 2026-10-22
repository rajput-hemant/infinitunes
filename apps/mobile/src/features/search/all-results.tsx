import { decode, getSearchItems, toCardItem } from "@infinitunes/types";
import type { AllSearch, SearchItem } from "@infinitunes/types";
import type { ReactElement } from "react";

import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Shelf } from "~/components/shelf";
import {
  SectionHeaderSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";
import { useOpenEntity } from "~/navigation/use-open-entity";

import { NoResults } from "./no-results";
import { ResultSection } from "./result-section";
import { isLinked } from "./search-items";
import type { ListSearchType } from "./search-types";
import { TopResultCard, TopResultCardSkeleton } from "./top-result-card";
import { useAllSearch } from "./use-all-search";

/** Rows shown per group before "See All" switches to the full list. */
const PREVIEW_ROWS = 4;

type AllResultsProps = {
  query: string;
  /** The type chips, rendered above the results. */
  header: ReactElement;
  onShowType: (type: ListSearchType) => void;
  onOpenResult: () => void;
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
  onOpenResult,
  onSearchArtist,
}: AllResultsProps) {
  const openEntity = useOpenEntity();
  const { state, retry } = useAllSearch(query);

  function open(item: SearchItem) {
    if (isLinked(item)) {
      openEntity(item.type, item.perma_url);
      onOpenResult();
    } else {
      onSearchArtist(decode(item.title));
    }
  }

  return (
    <ScreenScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {header}
      {state.status === "loading" ? (
        <>
          <TopResultCardSkeleton />
          <SectionHeaderSkeleton />
          <SongListSkeleton rows={PREVIEW_ROWS} />
        </>
      ) : null}
      {state.status === "error" ? (
        <ErrorState error={state.error} onRetry={retry} />
      ) : null}
      {state.status === "empty" ? <NoResults query={query} /> : null}
      {state.status === "ready" ? (
        <>
          <TopResultCard item={state.top} onPress={open} />
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
          <Shelf
            title="Albums"
            items={shelfItems(state.data, "albums")}
            onItemPress={onOpenResult}
          />
          <Shelf
            title="Playlists"
            items={shelfItems(state.data, "playlists")}
            onItemPress={onOpenResult}
          />
          <Shelf
            title="Podcasts"
            items={shelfItems(state.data, "shows")}
            onItemPress={onOpenResult}
          />
        </>
      ) : null}
    </ScreenScrollView>
  );
}
