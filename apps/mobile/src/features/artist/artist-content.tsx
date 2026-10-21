import type { Artist, Category } from "@infinitunes/types";
import { parseArtistBio, toSongRow } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";

import { SongRow } from "~/components/song-row";
import { playerDockInset } from "~/navigation/player-dock";
import { playerStore } from "~/playback/player-store";

import { AlbumRow } from "./album-row";
import { ArtistListHeader } from "./artist-list-header";
import type { ArtistListItem } from "./artist-list-items";
import type { ArtistTab } from "./artist-tabs";
import { visibleTabs } from "./artist-tabs";
import { BioSection } from "./bio-section";
import { useArtistPanel } from "./use-artist-panel";

type ArtistContentProps = {
  artist: Artist;
  /** Refetches the artist payload (pull to refresh also refreshes the open list). */
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

function renderItem({ item }: { item: ArtistListItem }) {
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

/** A loaded artist: header, tabs and one list whose rows follow the selected tab. */
export function ArtistContent({
  artist,
  onRefresh,
  isRefreshing,
}: ArtistContentProps) {
  const [tab, setTab] = useState<ArtistTab>("overview");
  const [category, setCategory] = useState<Category>("popularity");
  const bio = useMemo(() => parseArtistBio(artist.bio), [artist.bio]);
  const topSongs = useMemo(
    () => (artist.topSongs ?? []).map(toSongRow),
    [artist.topSongs],
  );
  const panel = useArtistPanel({ artist, tab, category, topSongs, bio });

  function refresh() {
    void onRefresh();
    void panel.refetch?.();
  }

  return (
    <FlashList
      testID="artist-list"
      data={panel.items}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      getItemType={(item) => item.kind}
      renderItem={renderItem}
      ListHeaderComponent={
        <ArtistListHeader
          artist={artist}
          tabs={visibleTabs(bio.length > 0)}
          tab={tab}
          onTabChange={setTab}
          category={category}
          onCategoryChange={setCategory}
          onPlay={() => playerStore.getState().playTracks(topSongs)}
          onShuffle={() =>
            playerStore.getState().playTracks(topSongs, { shuffle: true })
          }
        />
      }
      ListFooterComponent={panel.footer}
      onEndReached={panel.loadMore}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing || panel.isRefetching === true}
      onRefresh={refresh}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
    />
  );
}
