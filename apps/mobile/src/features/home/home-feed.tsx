import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import Animated from "react-native-reanimated";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Shelf } from "~/components/shelf";
import { CONTENT_REVEAL } from "~/components/skeletons";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { useCatalogLang } from "~/lib/preferences";
import { trpc } from "~/lib/trpc";

import { HomeHeader } from "./home-header";
import { buildHomeModel, isHomeEmpty } from "./home-model";
import type { HomeModel } from "./home-model";
import { HomeSkeleton } from "./home-skeleton";
import { QuickPicks } from "./quick-picks";

/**
 * The home feed: greeting and language chips, then the launch data's
 * featured carousel, quick picks and shelves (trending among them).
 */
export function HomeFeed() {
  const lang = useCatalogLang();
  const home = useQuery({
    ...trpc.home.home.queryOptions({ lang }),
    select: buildHomeModel,
  });

  return (
    <ScreenScrollView
      refreshControl={<PullToRefresh onRefresh={home.refetch} />}
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
          <Animated.View entering={CONTENT_REVEAL}>
            <HomeSections model={home.data} />
          </Animated.View>
        )
      ) : home.error ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <HomeSkeleton />
      )}
    </ScreenScrollView>
  );
}

function HomeSections({ model }: { model: HomeModel }) {
  const eyebrow = useCallback(
    (item: { id: string }) => model.eyebrows[item.id],
    [model.eyebrows],
  );
  return (
    <>
      <Shelf variant="hero" items={model.carousel} eyebrow={eyebrow} />
      <QuickPicks items={model.quickPicks} />
      {model.shelves.map(({ key, ...shelf }) => (
        <Shelf key={key} {...shelf} />
      ))}
    </>
  );
}
