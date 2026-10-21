import type { CardItem } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Shelf } from "~/components/shelf";
import { StationCard } from "~/components/station-card";
import { trpc } from "~/lib/trpc";

import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { buildHomeModel, isHomeEmpty } from "./home-model";
import type { HomeModel } from "./home-model";
import { HomeSkeleton } from "./home-skeleton";
import { QuickPicks } from "./quick-picks";

/**
 * The home feed: greeting and language chips, then the launch data's hero,
 * quick picks and shelves (trending among them).
 */
export function HomeFeed() {
  const home = useQuery({
    ...trpc.home.home.queryOptions({}),
    select: buildHomeModel,
  });

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={home.isRefetching}
          onRefresh={() => void home.refetch()}
        />
      }
    >
      <HomeHeader />
      {home.data ? (
        isHomeEmpty(home.data) ? (
          <EmptyState
            icon={{ ios: "music.note.house", android: "home" }}
            title="Nothing to play yet"
            message="Fresh music will show up here soon."
            action={{ label: "Try again", onPress: () => void home.refetch() }}
          />
        ) : (
          <HomeSections model={home.data} />
        )
      ) : home.error ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <HomeSkeleton />
      )}
    </ScreenScrollView>
  );
}

function renderStationCard(item: CardItem) {
  return <StationCard item={item} />;
}

function HomeSections({ model }: { model: HomeModel }) {
  return (
    <>
      {model.featured ? (
        <HomeHero featured={model.featured} tiles={model.heroTiles} />
      ) : null}
      <QuickPicks items={model.quickPicks} />
      {model.shelves.map(({ key, stations, ...shelf }) => (
        <Shelf
          key={key}
          {...shelf}
          renderCard={stations ? renderStationCard : undefined}
        />
      ))}
    </>
  );
}
