import type { Artist, Category } from "@infinitunes/types";
import { parseArtistBio, toSongRow, uniqueBy } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";

import { entityListKey } from "~/components/entity-list";
import { playerDockInset } from "~/navigation/player-dock";

import { ArtistListHeader } from "./artist-list-header";
import { renderArtistListItem } from "./artist-list-items";
import type { ArtistTab } from "./artist-tabs";
import { visibleTabs } from "./artist-tabs";
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
    () => uniqueBy((artist.topSongs ?? []).map(toSongRow), (row) => row.id),
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
      keyExtractor={entityListKey}
      getItemType={(item) => item.kind}
      renderItem={renderArtistListItem}
      ListHeaderComponent={
        <ArtistListHeader
          artist={artist}
          tabs={visibleTabs(bio.length > 0)}
          tab={tab}
          onTabChange={setTab}
          category={category}
          onCategoryChange={setCategory}
          topSongs={topSongs}
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
