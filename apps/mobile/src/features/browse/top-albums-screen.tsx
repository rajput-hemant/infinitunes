import { toCardItem } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { Stack } from "expo-router";

import { CatalogScreen } from "~/components/catalog-screen";
import { MediaCard } from "~/components/media-card";
import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";

import { CATALOG_PAGE_SIZE } from "./catalog-page-size";
import { LanguageFilter } from "./language-filter";
import { useLangParam } from "./use-lang-param";

/** Top albums, filterable by language, with endless paging. */
export function TopAlbumsScreen() {
  const lang = useLangParam();
  const albums = useInfiniteList({
    queryKey: [...trpc.get.topAlbums.pathKey(), { lang }],
    fetchPage: (page) =>
      trpcClient.get.topAlbums.query({ page, n: CATALOG_PAGE_SIZE, lang }),
    itemsOf: (page) => page.data,
    hasMore: (page) => !page.last_page,
    keyOf: (album) => album.id,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Top Albums" }} />
      <CatalogScreen
        query={albums}
        keyOf={(album) => album.id}
        renderCard={(album, width) => (
          <MediaCard item={toCardItem(album)} width={width} />
        )}
        empty={{
          icon: { ios: "square.stack", android: "album" },
          title: "No albums yet",
          message: "Try another language or check back later.",
        }}
        header={
          <LanguageFilter
            selected={lang}
            subtitle={
              lang
                ? `${languageLabel(lang)} albums trending this week`
                : "Trending across your languages"
            }
          />
        }
      />
    </>
  );
}
