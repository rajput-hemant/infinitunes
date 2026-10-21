import type { SongRowItem } from "@infinitunes/types";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { SongRow } from "~/components/song-row";

import { playFrom } from "./play-collection";

type TrackListProps = {
  rows: readonly SongRowItem[];
};

/** The songs of a detail page; a row plays the whole list from itself. */
export function TrackList({ rows }: TrackListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={{ ios: "music.note", android: "music_note" }}
        title="No songs yet"
      />
    );
  }

  return (
    <View>
      {rows.map((row, index) => (
        // The same song can sit twice in one playlist, so the id alone is not a key.
        <SongRow
          key={`${row.id}-${index}`}
          song={row}
          onPress={() => playFrom(rows, index)}
        />
      ))}
    </View>
  );
}
