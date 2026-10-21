import type { Artist, Category } from "@infinitunes/types";
import { parseArtistBio, toSongRow } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";

import { playerDockInset } from "~/navigation/player-dock";
import { playerStore } from "~/playback/player-store";

import { ArtistListHeader } from "./artist-list-header";
import type { ArtistTab } from "./artist-tabs";
import { visibleTabs } from "./artist-tabs";
import { listItemKey, renderListItem } from "./render-list-item";
import { useArtistPanel } from "./use-artist-panel";

type ArtistContentProps = {
  artist: Artist;
  /** Refetches the artist payload (pull to refresh also refreshes the open list). */
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

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
      keyExtractor={listItemKey}
      getItemType={(item) => item.kind}
      renderItem={renderListItem}
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
