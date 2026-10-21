import { toCardItem } from "@infinitunes/types";
import { Stack } from "expo-router";

import { CatalogScreen } from "~/components/catalog-screen";
import { MediaCard } from "~/components/media-card";
import { Text } from "~/components/ui/text";
import { trpc, trpcClient } from "~/lib/trpc";
import { CATALOG_PAGE_SIZE } from "~/lib/use-infinite-list";
import { useInfiniteList } from "~/lib/use-infinite-list";

/** Featured radio stations with endless paging; upstream ends a list with a short page. */
export function FeaturedStationsScreen() {
  const stations = useInfiniteList({
    queryKey: trpc.get.featuredStations.pathKey(),
    fetchPage: (page) =>
      trpcClient.get.featuredStations.query({ page, n: CATALOG_PAGE_SIZE }),
    itemsOf: (page) => page,
    hasMore: (page) => page.length >= CATALOG_PAGE_SIZE,
    keyOf: (station) => station.id,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Radio" }} />
      <CatalogScreen
        query={stations}
        keyOf={(station) => station.id}
        renderCard={(station, width) => (
          <MediaCard item={toCardItem(station)} width={width} />
        )}
        empty={{
          icon: { ios: "dot.radiowaves.left.and.right", android: "radio" },
          title: "No radio stations",
          message: "Try again later.",
        }}
        header={
          <Text variant="subhead" tone="muted" className="px-page py-2">
            Endless stations for every mood.
          </Text>
        }
      />
    </>
  );
}
