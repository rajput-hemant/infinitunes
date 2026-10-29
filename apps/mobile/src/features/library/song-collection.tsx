import type { SongRowItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Platform, View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import ReorderableList from "react-native-reorderable-list";

import type { ReorderActions } from "~/components/drag-handle";
import { EmptyState } from "~/components/empty-state";
import { OptionMenu } from "~/components/option-menu";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SkeletonText, SongListSkeleton } from "~/components/skeletons";
import { IconButton } from "~/components/ui/icon-button";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { SkeletonBlock } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { playerDockInset } from "~/navigation/player-dock";
import {
  barScrollProps,
  useScrolledBarOffset,
} from "~/navigation/use-scrolled-bar";
import { playAll, playFrom, shuffleAll } from "~/playback/play-collection";

import { FilterField, FilterHeader } from "./song-filter";
import { orderSongs, type SongSort } from "./song-order";

type SongCollectionProps = {
  songs: readonly SongRowItem[];
  /** Saved songs that did not load; the list says so rather than hiding them. */
  missing: number;
  onRefresh: () => Promise<unknown>;
  /** What the list's own order is called ("Recently played"). */
  recentLabel: string;
  /**
   * One row; `play` starts the shown list from it. Rows with `reorder` are
   * inside the drag list and show a handle (`useReorderableDrag`) whose
   * actions move the row without dragging.
   */
  renderRow: (
    song: SongRowItem,
    play: () => void,
    reorder: ReorderActions | undefined,
  ) => ReactElement;
  /**
   * Moves a song in the list's own order (a playlist): `before` is the song
   * it now precedes, `undefined` at the end. Offered while that order is
   * shown unfiltered.
   */
  onMove?: (song: SongRowItem, before: SongRowItem | undefined) => void;
  /** Above the controls (a playlist's title). */
  header?: ReactElement;
};

function countLabel(shown: number, total: number): string {
  const noun = total === 1 ? "song" : "songs";
  return shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`;
}

/**
 * A song list with the library's controls: a filter field (iOS's native
 * header field, Android's M3 search bar atop the list), a sort
 * menu, Play and Shuffle over what is shown, pull to refresh, and dragging
 * rows into a new order where the list has one of its own.
 */
export function SongCollection({
  songs,
  missing,
  onRefresh,
  recentLabel,
  renderRow,
  onMove,
  header,
}: SongCollectionProps) {
  const barOffset = useScrolledBarOffset();
  const scrolledBar = useMemo(() => barScrollProps(barOffset), [barOffset]);
  // ReorderableList composes only Reanimated handlers: its worklet feeds the
  // bar scrim directly.
  const reorderableScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      barOffset?.set(event.contentOffset.y);
    },
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SongSort>("recent");
  const shown = useMemo(
    () => orderSongs(songs, query, sort),
    [songs, query, sort],
  );
  const reorderable =
    onMove !== undefined && sort === "recent" && !query.trim();

  /** Moves the shown row `from` to index `to`, as the drag list reports it. */
  function move(from: number, to: number) {
    const song = shown[from];
    if (!song || from === to || !onMove) return;
    const rest = shown.filter((_, index) => index !== from);
    onMove(song, rest[to]);
  }

  const reorderActions = (index: number): ReorderActions | undefined =>
    reorderable
      ? {
          moveUp: index > 0 ? () => move(index, index - 1) : undefined,
          moveDown:
            index < shown.length - 1 ? () => move(index, index + 1) : undefined,
        }
      : undefined;

  const listProps = {
    data: shown,
    keyExtractor: (song: SongRowItem) => song.id,
    renderItem: ({ item, index }: { item: SongRowItem; index: number }) =>
      renderRow(item, () => playFrom(shown, index), reorderActions(index)),
    ListHeaderComponent: (
      <View>
        {header}
        <FilterField query={query} onChangeText={setQuery} />
        {/* One compact row: the count and sort lead, Shuffle and Play close it. */}
        {/* At Play's height even while a filter hides the buttons: no jump. */}
        <View className="min-h-row flex-row items-center gap-2 pl-page pr-4">
          <Text variant="subhead" tone="muted" className="shrink">
            {countLabel(shown.length, songs.length)}
          </Text>
          <OptionMenu
            label="Sort songs"
            variant="plain"
            options={[
              { id: "recent", title: recentLabel },
              { id: "title", title: "Title A-Z" },
              { id: "artist", title: "Artist A-Z" },
            ]}
            selectedId={sort}
            onSelect={setSort}
          />
          <View className="flex-1" />
          {shown.length > 0 ? (
            <>
              <IconButton
                icon={{ ios: "shuffle", android: "shuffle" }}
                label="Shuffle"
                variant="tonal"
                onPress={() => shuffleAll(shown)}
              />
              <IconButton
                icon={{ ios: "play.fill", android: "play_arrow" }}
                label="Play"
                variant="filled"
                size="xl"
                large
                onPress={() => playAll(shown)}
              />
            </>
          ) : null}
        </View>
        {missing > 0 ? (
          <Text variant="caption" tone="muted" className="px-page pb-2">
            {missing === 1
              ? "1 song couldn't load."
              : `${missing} songs couldn't load.`}{" "}
            Pull down to try again.
          </Text>
        ) : null}
      </View>
    ),
    ListEmptyComponent: (
      <EmptyState
        icon={{ ios: "magnifyingglass", android: "search" }}
        title={`No songs match “${query.trim()}”`}
        message="Try another title or artist."
      />
    ),
    contentInsetAdjustmentBehavior: "automatic" as const,
    contentContainerStyle: { paddingBottom: playerDockInset },
    keyboardShouldPersistTaps: "handled" as const,
    refreshControl: <PullToRefresh onRefresh={onRefresh} />,
  };

  return (
    <>
      <FilterHeader query={query} onChangeText={setQuery} />
      {onMove ? (
        // One list for the screen's life: filtering only turns dragging off,
        // so typing never remounts it or loses the scroll position.
        <ReorderableList
          {...listProps}
          onScroll={reorderableScroll}
          dragEnabled={reorderable}
          onReorder={({ from, to }) => move(from, to)}
        />
      ) : (
        <FlashList {...listProps} {...scrolledBar} />
      )}
    </>
  );
}

type SongCollectionSkeletonProps = {
  /** The screen's own lines above the controls (a playlist's duration). */
  header?: ReactElement;
};

/**
 * The collection while it loads, at its real geometry: the same filter field
 * in the header (so the content starts where it will), the count, sort,
 * Shuffle and Play row, then rows.
 */
export function SongCollectionSkeleton({
  header,
}: SongCollectionSkeletonProps) {
  return (
    <>
      <FilterHeader query="" />
      <ScreenScrollView scrollEnabled={false}>
        <SongListSkeleton
          header={
            <>
              {header}
              <FilterField query="" />
              <View className="min-h-row flex-row items-center gap-2 pl-page pr-4">
                <SkeletonText variant="subhead" width={64} />
                {/* The sort trigger's own height (OptionMenu's plain trigger). */}
                <View className="min-h-touch justify-center">
                  <SkeletonText variant="subhead" width={88} />
                </View>
                <View className="flex-1" />
                {/* Shuffle: Android's 40dp tonal container, iOS's 48pt button. */}
                <SkeletonBlock
                  className={
                    Platform.OS === "android"
                      ? "size-ctl rounded-full"
                      : "size-touch rounded-full"
                  }
                />
                <SkeletonBlock className="size-row rounded-full" />
              </View>
            </>
          }
        />
      </ScreenScrollView>
    </>
  );
}
