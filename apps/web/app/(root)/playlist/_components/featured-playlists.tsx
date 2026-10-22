"use client";

import type { FeaturedPlaylists, Lang } from "@infinitunes/types";
import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogLoadMore } from "~/components/catalog-load-more";
import { QueryScope } from "~/components/query-scope";
import { FIRST_ROW_CARDS, SliderCard } from "~/components/slider/slider-card";
import { trpc } from "~/lib/trpc/vanilla";

type FeaturedPlaylistsProps = {
  initialPlaylists: FeaturedPlaylists;
  lang?: Lang;
  /** The 1-based page `initial*` holds (`?page=N`); the next request is N + 1. */
  page?: number;
};

function FeaturedPlaylistsContent({
  initialPlaylists,
  lang,
  page = 1,
}: FeaturedPlaylistsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-playlists", lang, page],
      queryFn: ({ pageParam }) =>
        trpc.get.featuredPlaylists.query({ page: pageParam, n: 50, lang }),
      initialPageParam: page,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.last_page ? null : lastPageParam + 1,
      initialData: { pages: [initialPlaylists], pageParams: [page] },
    });

  const featuredPlaylists = uniqueBy(
    data.pages.flatMap((group) => group.data),
    (playlist) => playlist.id,
  );

  return (
    <div>
      <CatalogGrid>
        {featuredPlaylists.map(
          (
            { id, title, perma_url, subtitle, type, image, explicit_content },
            index,
          ) => (
            <SliderCard
              priority={index < FIRST_ROW_CARDS}
              key={id}
              name={title}
              url={perma_url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit_content}
            />
          ),
        )}
      </CatalogGrid>

      <CatalogLoadMore
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}

export function FeaturedPlaylists(
  props: ComponentProps<typeof FeaturedPlaylistsContent>,
) {
  return (
    <QueryScope>
      <FeaturedPlaylistsContent {...props} />
    </QueryScope>
  );
}
