import type { SongRowItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { useState } from "react";
import type { ReactElement } from "react";
import { View } from "react-native";
import ReorderableList from "react-native-reorderable-list";

import { OptionMenu } from "~/components/option-menu";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { playerDockInset } from "~/navigation/player-dock";
import { playerStore } from "~/playback/player-store";

import { orderSongs, type SongSort } from "./song-order";

type SongCollectionProps = {
  songs: readonly SongRowItem[];
  /** Saved songs that did not load; the list says so rather than hiding them. */
  missing: number;
  refreshing: boolean;
  onRefresh: () => void;
  /** What the list's own order is called ("Recently played"). */
  recentLabel: string;
  /**
   * One row; `play` starts the shown list from it. `reorderable` rows are
   * inside the drag list and show a handle (`useReorderableDrag`).
   */
  renderRow: (
    song: SongRowItem,
    play: () => void,
    reorderable: boolean,
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
 * A song list with the library's controls: native search to filter, a sort
 * menu, Play and Shuffle over what is shown, pull to refresh, and dragging
 * rows into a new order where the list has one of its own.
 */
export function SongCollection({
  songs,
  missing,
  refreshing,
  onRefresh,
  recentLabel,
  renderRow,
  onMove,
  header,
}: SongCollectionProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SongSort>("recent");
  const shown = orderSongs(songs, query, sort);
  const { playTracks } = playerStore.getState();
  const reorderable =
    onMove !== undefined && sort === "recent" && !query.trim();

  const listProps = {
    data: shown,
    keyExtractor: (song: SongRowItem) => song.id,
    renderItem: ({ item, index }: { item: SongRowItem; index: number }) =>
      renderRow(
        item,
        () => playTracks(shown, { startIndex: index }),
        reorderable,
      ),
    ListHeaderComponent: (
      <View>
        {header}
        {shown.length > 0 ? (
          <View className="flex-row gap-3 px-page pb-2">
            <Button
              label="Play"
              icon={{ ios: "play.fill", android: "play_arrow" }}
              onPress={() => playTracks(shown)}
              className="flex-1"
            />
            <Button
              label="Shuffle"
              icon={{ ios: "shuffle", android: "shuffle" }}
              variant="secondary"
              onPress={() => playTracks(shown, { shuffle: true })}
              className="flex-1"
            />
          </View>
        ) : null}
        <View className="flex-row items-center justify-between px-page">
          <Text variant="subhead" tone="muted" accessibilityRole="summary">
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
      <Text tone="muted" className="px-page py-10 text-center">
        No songs match “{query.trim()}”.
      </Text>
    ),
    contentInsetAdjustmentBehavior: "automatic" as const,
    contentContainerStyle: { paddingBottom: playerDockInset },
    keyboardShouldPersistTaps: "handled" as const,
    refreshing,
    onRefresh,
  };

  return (
    <>
      <Stack.SearchBar
        placeholder="Filter by title or artist"
        autoCapitalize="none"
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
      />
      {reorderable ? (
        <ReorderableList
          {...listProps}
          onReorder={({ from, to }) => {
            const song = shown[from];
            if (!song || from === to || !onMove) return;
            const rest = shown.filter((_, index) => index !== from);
            onMove(song, rest[to]);
          }}
        />
      ) : (
        <FlashList {...listProps} />
      )}
    </>
  );
}
