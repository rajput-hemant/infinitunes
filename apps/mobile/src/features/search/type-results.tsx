import { toSongRow } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import { View } from "react-native";

import { EndOfList } from "~/components/end-of-list";
import { GridCell } from "~/components/grid-cell";
import { MediaCard } from "~/components/media-card";
import { SongRow } from "~/components/song-row";
import { Spinner } from "~/components/ui/spinner";
import { useGrid } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { useScrolledBar } from "~/navigation/use-scrolled-bar";
import { playFrom } from "~/playback/play-collection";

import { isSongEntry, toResultCard } from "./result-cards";
import { ResultsPlaceholder } from "./results-placeholder";
import type { ListSearchType } from "./search-types";
import { useTypeResults } from "./use-type-results";

type TypeResultsProps = {
  query: string;
  type: ListSearchType;
  /** The type chips, rendered above the list. */
  header: ReactElement;
  /** A song was played from the list. */
  onOpenResult: () => void;
};

const listProps = {
  contentInsetAdjustmentBehavior: "automatic",
  keyboardShouldPersistTaps: "handled",
  keyboardDismissMode: "on-drag",
  onEndReachedThreshold: 0.5,
} as const;

/** One type's full result list, paged as it scrolls: songs play, everything else opens. */
export function TypeResults({
  query,
  type,
  header,
  onOpenResult,
}: TypeResultsProps) {
  const results = useTypeResults(query, type);
  const scrolledBar = useScrolledBar();
  const { columns, width: cardWidth } = useGrid("cards");

  const { entries } = results;
  const rows = useMemo(
    () => entries.filter(isSongEntry).map(toSongRow),
    [entries],
  );
  const cards = useMemo(
    () => entries.filter((entry) => !isSongEntry(entry)).map(toResultCard),
    [entries],
  );
  const renderSong = useCallback(
    ({ item, index }: { item: (typeof rows)[number]; index: number }) => (
      <SongRow
        song={item}
        onPress={() => {
          playFrom(rows, index);
          onOpenResult();
        }}
      />
    ),
    [rows, onOpenResult],
  );
  const renderCard = useCallback(
    ({ item, index }: { item: (typeof cards)[number]; index: number }) => (
      <GridCell index={index} columns={columns}>
        <MediaCard item={item} width={cardWidth} onPress={onOpenResult} />
      </GridCell>
    ),
    [columns, cardWidth, onOpenResult],
  );

  const common = {
    ...listProps,
    ListHeaderComponent: header,
    ListEmptyComponent:
      results.status === "ready" ? null : (
        <ResultsPlaceholder
          query={query}
          status={results.status}
          error={results.error}
          onRetry={results.retry}
          skeleton={
            type === "song" ? "rows" : type === "artist" ? "round" : "cards"
          }
        />
      ),
    ListFooterComponent: results.isFetchingNextPage ? (
      <View className="py-4">
        <Spinner />
      </View>
    ) : results.status === "ready" && !results.hasNextPage ? (
      <EndOfList>You have reached the end of these results.</EndOfList>
    ) : null,
    onEndReached: results.loadMore,
    contentContainerStyle: { paddingBottom: playerDockInset },
    ...scrolledBar,
  };

  if (type === "song") {
    return (
      <FlashList
        key={type}
        {...common}
        data={rows}
        keyExtractor={(row) => row.id}
        renderItem={renderSong}
      />
    );
  }

  return (
    <FlashList
      key={type}
      {...common}
      data={cards}
      numColumns={columns}
      keyExtractor={(card) => card.id}
      renderItem={renderCard}
    />
  );
}
