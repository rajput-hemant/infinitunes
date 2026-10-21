import { toCardItem } from "@infinitunes/types";
import { Stack } from "expo-router";

import { MediaCard } from "~/components/media-card";
import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";

import { CATALOG_PAGE_SIZE } from "./catalog-page-size";
import { CatalogScreen } from "./catalog-screen";
import { LanguageFilter } from "./language-filter";
import { languageLabel } from "./languages";
import { useLangParam } from "./use-lang-param";

/** Featured playlists, filterable by language, with endless paging. */
export function FeaturedPlaylistsScreen() {
  const lang = useLangParam();
  const playlists = useInfiniteList({
    queryKey: [...trpc.get.featuredPlaylists.pathKey(), { lang }],
    fetchPage: (page) =>
      trpcClient.get.featuredPlaylists.query({
        page,
        n: CATALOG_PAGE_SIZE,
        lang,
      }),
    itemsOf: (page) => page.data,
    hasMore: (page) => !page.last_page,
    keyOf: (playlist) => playlist.id,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: `${lang ? `${languageLabel(lang)} Music` : "Top"} Playlists`,
        }}
      />
      <CatalogScreen
        query={playlists}
        keyOf={(playlist) => playlist.id}
        renderCard={(playlist, width) => (
          <MediaCard item={toCardItem(playlist)} width={width} />
        )}
        empty={{
          icon: { ios: "music.note.list", android: "queue_music" },
          title: "No playlists yet",
          message: "Try another language or check back later.",
        }}
        header={<LanguageFilter selected={lang} />}
      />
    </>
  );
}
