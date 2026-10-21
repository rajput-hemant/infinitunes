import type { Label } from "@infinitunes/types";
import { decode, toCardItem, toSongRow, uniqueBy } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { EntityHeader } from "~/components/entity-header";
import { albumItems, songItems } from "~/features/artist/artist-list-items";
import {
  listItemKey,
  renderListItem,
} from "~/features/artist/render-list-item";
import { SegmentedTabs } from "~/features/artist/segmented-tabs";
import { playerDockInset } from "~/navigation/player-dock";
import { playerStore } from "~/playback/player-store";

import type { LabelTab } from "./label-tabs";
import { LABEL_TABS, LABEL_TAB_LABELS } from "./label-tabs";

type LabelContentProps = {
  label: Label;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

/** A loaded label: header, a Songs/Albums switch and one list under it. */
export function LabelContent({
  label,
  onRefresh,
  isRefreshing,
}: LabelContentProps) {
  // Albums first, as on the web.
  const [tab, setTab] = useState<LabelTab>("albums");
  const songs = useMemo(
    () => label.topSongs.songs.map(toSongRow),
    [label.topSongs.songs],
  );
  const albums = useMemo(
    () => uniqueBy(label.topAlbums.albums, (album) => album.id).map(toCardItem),
    [label.topAlbums.albums],
  );
  const items = tab === "songs" ? songItems(songs) : albumItems(albums);

  return (
    <FlashList
      data={items}
      keyExtractor={listItemKey}
      getItemType={(item) => item.kind}
      renderItem={renderListItem}
      ListHeaderComponent={
        <View className="gap-3 pb-2">
          <EntityHeader
            image={label.image}
            title={decode(label.name)}
            subtitle="Record label"
            round
            onPlay={() => playerStore.getState().playTracks(songs)}
            onShuffle={() =>
              playerStore.getState().playTracks(songs, { shuffle: true })
            }
          />
          <SegmentedTabs
            testID="label-tabs"
            tabs={LABEL_TABS}
            labels={LABEL_TAB_LABELS}
            value={tab}
            onChange={setTab}
          />
        </View>
      }
      ListFooterComponent={
        items.length === 0 ? (
          <EmptyState
            icon={{ ios: "opticaldisc", android: "album" }}
            title={`No ${tab} yet`}
            message={`This label has no ${tab} to show right now.`}
          />
        ) : null
      }
      refreshing={isRefreshing}
      onRefresh={() => void onRefresh()}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
    />
  );
}
