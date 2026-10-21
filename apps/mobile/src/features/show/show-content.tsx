import type { Show, Sort } from "@infinitunes/types";
import { decode, formatCount, isExplicit, plainText } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import { EntityHeader } from "~/components/entity-header";
import {
  entityListKey,
  renderEntityListItem,
  songItems,
} from "~/components/entity-list";
import { PagedFooter } from "~/components/paged-footer";
import { SectionHeader } from "~/components/section-header";
import { Text } from "~/components/ui/text";
import { playerDockInset } from "~/navigation/player-dock";
import { playAll, shuffleAll } from "~/playback/play-collection";

import { ShowControls } from "./show-controls";
import { useShowEpisodes } from "./use-show-episodes";

type ShowContentProps = {
  show: Show;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
  /** The season the route names (`/show/<name>/<season>/<token>`); the latest by default. */
  initialSeason?: number;
};

function fansLabel(show: Show): string | undefined {
  const fans = show.show_details.more_info.fan_count;
  return Number(fans) > 0 ? `${formatCount(fans)} Fans` : undefined;
}

/** A loaded show: header, description, season and order pickers, and the season's episodes. */
export function ShowContent({
  show,
  onRefresh,
  isRefreshing,
  initialSeason,
}: ShowContentProps) {
  const { show_details: details } = show;
  const [chosenSeason, setSeason] = useState(initialSeason);
  const [sort, setSort] = useState<Sort>("desc");
  const season = chosenSeason ?? Number(details.more_info.season_number);
  const episodes = useShowEpisodes({ show, season, sort });
  const description = plainText(details.more_info.description);

  function play(shuffle: boolean) {
    if (episodes.items.length === 0) {
      toast("Episodes are still loading");
      return;
    }
    (shuffle ? shuffleAll : playAll)(episodes.items);
  }

  return (
    <FlashList
      data={songItems(episodes.items)}
      keyExtractor={entityListKey}
      renderItem={renderEntityListItem}
      ListHeaderComponent={
        <View>
          <EntityHeader
            image={details.image}
            eyebrow="Podcast"
            title={decode(details.title)}
            subtitle={decode(details.subtitle)}
            meta={fansLabel(show)}
            explicit={isExplicit(details.explicit_content)}
            onPlay={() => play(false)}
            onShuffle={() => play(true)}
            like={{ type: "show", token: details.id }}
          />
          {description ? (
            <>
              <SectionHeader title={decode(show.modules.show_details.title)} />
              <Text tone="muted" selectable className="px-page">
                {description}
              </Text>
            </>
          ) : null}
          <ShowControls
            seasons={show.seasons}
            season={season}
            onSeasonChange={setSeason}
            sort={sort}
            onSortChange={setSort}
          />
        </View>
      }
      ListFooterComponent={
        <PagedFooter
          isPending={episodes.isPending}
          error={episodes.error}
          isFetchingNextPage={episodes.isFetchingNextPage}
          isEmpty={episodes.items.length === 0}
          emptyTitle="No episodes yet"
          onRetry={() => void episodes.refetch()}
        />
      }
      onEndReached={episodes.loadMore}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing || episodes.isRefetching}
      onRefresh={() => {
        void onRefresh();
        void episodes.refetch();
      }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
      testID="show-list"
    />
  );
}
