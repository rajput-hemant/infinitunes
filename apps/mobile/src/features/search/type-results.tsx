import { toSongRow } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import type { ReactElement } from "react";
import { View } from "react-native";

import { GridCell } from "~/components/grid-cell";
import { MediaCard } from "~/components/media-card";
import { SongRow } from "~/components/song-row";
import { Spinner } from "~/components/ui/spinner";
import { Text } from "~/components/ui/text";
import { CARD_COLUMNS, useGridCardWidth } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
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
  const cardWidth = useGridCardWidth(CARD_COLUMNS);

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
      <Text variant="subhead" tone="muted" className="py-6 text-center">
        You have reached the end of these results.
      </Text>
    ) : null,
    onEndReached: results.loadMore,
    contentContainerStyle: { paddingBottom: playerDockInset },
  };

  if (type === "song") {
    const rows = results.entries.filter(isSongEntry).map(toSongRow);
    return (
      <FlashList
        {...common}
        data={rows}
        keyExtractor={(row) => row.id}
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            onPress={() => {
              playFrom(rows, index);
              onOpenResult();
            }}
          />
        )}
      />
    );
  }

  const cards = results.entries
    .filter((entry) => !isSongEntry(entry))
    .map(toResultCard);

  return (
    <FlashList
      {...common}
      data={cards}
      numColumns={CARD_COLUMNS}
      keyExtractor={(card) => card.id}
      renderItem={({ item, index }) => (
        <GridCell index={index}>
          <MediaCard item={item} width={cardWidth} onPress={onOpenResult} />
        </GridCell>
      )}
    />
  );
}
