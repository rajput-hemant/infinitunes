import type { Label } from "@infinitunes/types";
import { decode, toCardItem, toSongRow, uniqueBy } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { EntityHeader } from "~/components/entity-header";
import {
  cardItems,
  entityListKey,
  renderEntityListItem,
  songItems,
} from "~/components/entity-list";
import { SegmentedTabs } from "~/components/segmented-tabs";
import { playerDockInset } from "~/navigation/player-dock";
import { playAll, shuffleAll } from "~/playback/play-collection";

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
    () => uniqueBy(label.topSongs.songs.map(toSongRow), (row) => row.id),
    [label.topSongs.songs],
  );
  const albums = useMemo(
    () => uniqueBy(label.topAlbums.albums, (album) => album.id).map(toCardItem),
    [label.topAlbums.albums],
  );
  const items = tab === "songs" ? songItems(songs) : cardItems(albums);

  return (
    <FlashList
      data={items}
      keyExtractor={entityListKey}
      getItemType={(item) => item.kind}
      renderItem={renderEntityListItem}
      ListHeaderComponent={
        <View className="gap-3 pb-2">
          <EntityHeader
            image={label.image}
            title={decode(label.name)}
            subtitle="Record label"
            round
            onPlay={() => playAll(songs)}
            onShuffle={() => shuffleAll(songs)}
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
