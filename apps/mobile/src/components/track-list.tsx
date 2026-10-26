import type { SongRowItem } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import type { ListRenderItem } from "@shopify/flash-list";
import { useCallback } from "react";
import type { ReactElement } from "react";
import { View } from "react-native";

import { useDetailListProps } from "~/components/detail/detail-screen";
import { EmptyState } from "~/components/empty-state";
import { SongRow } from "~/components/song-row";
import { playFrom } from "~/playback/play-collection";

type TrackListProps = {
  rows: readonly SongRowItem[];
  /** Track numbers instead of artwork: an album, whose rows share one cover. */
  numbered?: boolean;
};

function NoSongs() {
  return (
    <EmptyState
      icon={{ ios: "music.note", android: "music_note" }}
      title="No songs yet"
    />
  );
}

type TrackRowProps = {
  rows: readonly SongRowItem[];
  index: number;
  numbered: boolean;
};

/** One track; pressing it plays the whole list from there. */
function TrackRow({ rows, index, numbered }: TrackRowProps) {
  return (
    <SongRow
      song={rows[index]}
      onPress={() => playFrom(rows, index)}
      leading={numbered ? "index" : "artwork"}
      index={index + 1}
    />
  );
}

// The same song can sit twice in one playlist, so the id alone is not a key.
function trackKey(row: SongRowItem, index: number) {
  return `${row.id}-${index}`;
}

/**
 * A few songs inside a page's scroll view (the rest of a song's album).
 * A page that is mostly its songs uses `TrackListPage`.
 */
export function TrackList({ rows, numbered = false }: TrackListProps) {
  if (rows.length === 0) return <NoSongs />;

  return (
    <View>
      {rows.map((row, index) => (
        <TrackRow
          key={trackKey(row, index)}
          rows={rows}
          index={index}
          numbered={numbered}
        />
      ))}
    </View>
  );
}

type TrackListPageProps = TrackListProps & {
  /** Above the songs: the entity header. */
  header: ReactElement;
  /** Below the songs: copyright, shelves. */
  footer?: ReactElement;
};

/**
 * The songs of a `DetailScreen list` page as its one virtualized list, with
 * the page's header and shelves around them, so an album or a long playlist
 * mounts only the rows on screen.
 */
export function TrackListPage({
  rows,
  numbered = false,
  header,
  footer,
}: TrackListPageProps) {
  const listProps = useDetailListProps();
  const renderItem = useCallback<ListRenderItem<SongRowItem>>(
    ({ index }) => <TrackRow rows={rows} index={index} numbered={numbered} />,
    [rows, numbered],
  );

  return (
    <FlashList
      testID="track-list"
      data={rows}
      keyExtractor={trackKey}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={<NoSongs />}
      {...listProps}
    />
  );
}
