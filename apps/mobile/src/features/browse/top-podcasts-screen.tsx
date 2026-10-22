import { toCardItem } from "@infinitunes/types";
import type { TopShows } from "@infinitunes/types";
import { Stack } from "expo-router";

import { CatalogScreen } from "~/components/catalog-screen";
import { MediaCard } from "~/components/media-card";
import { SectionHeader } from "~/components/section-header";
import { Shelf } from "~/components/shelf";
import { SectionHeaderSkeleton, ShelfSkeleton } from "~/components/skeletons";
import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";
import { CATALOG_PAGE_SIZE } from "~/lib/use-infinite-list";

const TRENDING_FALLBACK_TITLE = "Trending Podcasts";

function TrendingPodcasts({ shows }: { shows: TopShows }) {
  const group = shows.trendingPodcasts?.[0];
  if (!group) return null;

  return (
    <Shelf
      title={group.module.title || TRENDING_FALLBACK_TITLE}
      items={group.items.map(toCardItem)}
    />
  );
}

/** Top podcasts: the trending shelf above every show, with endless paging. */
export function TopPodcastsScreen() {
  const shows = useInfiniteList({
    queryKey: trpc.get.topShows.pathKey(),
    fetchPage: (page) =>
      trpcClient.get.topShows.query({ page, n: CATALOG_PAGE_SIZE }),
    itemsOf: (page) => page.data,
    hasMore: (page) => !page.last_page,
    keyOf: (show) => show.id,
  });
  const firstPage = shows.data?.pages[0];

  return (
    <>
      <Stack.Screen options={{ title: "Podcasts" }} />
      <CatalogScreen
        query={shows}
        keyOf={(show) => show.id}
        renderCard={(show, width) => (
          <MediaCard item={toCardItem(show)} width={width} />
        )}
        empty={{
          icon: { ios: "mic", android: "podcasts" },
          title: "No podcasts yet",
          message: "Check back later for new shows.",
        }}
        header={
          firstPage ? (
            <>
              <TrendingPodcasts shows={firstPage} />
              <SectionHeader title="All Podcasts" />
            </>
          ) : shows.isPending ? (
            // The loaded header's shape: the Trending shelf, then "All Podcasts".
            <>
              <ShelfSkeleton />
              <SectionHeaderSkeleton />
            </>
          ) : undefined
        }
      />
    </>
  );
}
