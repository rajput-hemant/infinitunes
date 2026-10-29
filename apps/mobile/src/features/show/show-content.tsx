import type { Show, Sort } from "@infinitunes/types";
import {
  decode,
  formatCount,
  isExplicit,
  parseToken,
  plainText,
} from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { View } from "react-native";

import { Description } from "~/components/detail/description";
import { useDetailScrollProps } from "~/components/detail/detail-scroll";
import { EntityHeader } from "~/components/entity-header";
import {
  entityListKey,
  renderEntityListItem,
  songItems,
} from "~/components/entity-list";
import { PagedFooter } from "~/components/paged-footer";
import { SectionHeader } from "~/components/section-header";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { playAll, shuffleAll } from "~/playback/play-collection";

import { ShowControls } from "./show-controls";
import { useShowEpisodes } from "./use-show-episodes";

type ShowContentProps = {
  show: Show;
  onRefresh: () => Promise<unknown>;
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
  initialSeason,
}: ShowContentProps) {
  const scrollProps = useDetailScrollProps();
  const { show_details: details } = show;
  const [chosenSeason, setSeason] = useState(initialSeason);
  const [sort, setSort] = useState<Sort>("desc");
  // A season the show does not have (a stale or hand-edited link) opens the latest.
  const latest = Number(details.more_info.season_number);
  const season =
    chosenSeason !== undefined &&
    show.seasons.some(
      (option) => Number(option.more_info.season_number) === chosenSeason,
    )
      ? chosenSeason
      : latest;
  const episodes = useShowEpisodes({ show, season, sort });
  const description = plainText(details.more_info.description);

  function play(shuffle: boolean) {
    if (episodes.items.length === 0) return;
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
            like={{
              type: "show",
              token: details.id,
              linkToken: parseToken(details.perma_url),
            }}
          />
          {description ? (
            <>
              <SectionHeader title={decode(show.modules.show_details.title)} />
              <Description text={description} />
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
      refreshControl={
        <PullToRefresh
          onRefresh={() => Promise.all([onRefresh(), episodes.refetch()])}
        />
      }
      contentInsetAdjustmentBehavior="automatic"
      {...scrollProps}
      testID="show-list"
    />
  );
}
