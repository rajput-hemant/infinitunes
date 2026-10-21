import { SongRow } from "~/components/song-row";
import { playerStore } from "~/playback/player-store";

import { AlbumRow } from "./album-row";
import type { ArtistListItem } from "./artist-list-items";
import { BioSection } from "./bio-section";

/** `FlashList`'s `renderItem` for the song, album and biography rows of an entity screen. */
export function renderListItem({ item }: { item: ArtistListItem }) {
  switch (item.kind) {
    case "song":
      return (
        <SongRow
          song={item.row}
          onPress={() =>
            playerStore
              .getState()
              .playTracks(item.queue, { startIndex: item.index })
          }
        />
      );
    case "album":
      return <AlbumRow card={item.card} />;
    case "bio":
      return <BioSection section={item.section} />;
  }
}

export function listItemKey(item: ArtistListItem): string {
  return `${item.kind}-${item.id}`;
}
