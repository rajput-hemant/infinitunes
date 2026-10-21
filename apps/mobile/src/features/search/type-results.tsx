import { toSongRow } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import type { ReactElement } from "react";
import { ActivityIndicator, View, useWindowDimensions } from "react-native";

import { MediaCard } from "~/components/media-card";
import { SongRow } from "~/components/song-row";
import { playerDockInset } from "~/navigation/player-dock";
import { playerStore } from "~/playback/player-store";
import { sizes } from "~/theme/tokens";

import { isSongEntry, toResultCard } from "./result-cards";
import { ResultsPlaceholder } from "./results-placeholder";
import type { ListSearchType } from "./search-types";
import { useTypeResults } from "./use-type-results";

const CARD_GAP = 12;

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
  const { width } = useWindowDimensions();

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
          skeleton={type === "song" ? "rows" : "cards"}
        />
      ),
    ListFooterComponent: results.isFetchingNextPage ? (
      <View className="py-4">
        <ActivityIndicator />
      </View>
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
              playerStore.getState().playTracks(rows, { startIndex: index });
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
  const cardWidth = (width - 2 * sizes.page - CARD_GAP) / 2;

  return (
    <FlashList
      {...common}
      data={cards}
      numColumns={2}
      keyExtractor={(card) => card.id}
      renderItem={({ item, index }) => (
        <View
          className={index % 2 === 0 ? "items-start" : "items-end"}
          style={
            index % 2 === 0
              ? { paddingLeft: sizes.page, paddingBottom: CARD_GAP }
              : { paddingRight: sizes.page, paddingBottom: CARD_GAP }
          }
        >
          <MediaCard item={item} width={cardWidth} onPress={onOpenResult} />
        </View>
      )}
    />
  );
}
