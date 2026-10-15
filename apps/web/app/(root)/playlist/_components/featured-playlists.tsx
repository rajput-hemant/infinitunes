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
};

function FeaturedPlaylistsContent({
  initialPlaylists,
  lang,
}: FeaturedPlaylistsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-playlists", lang],
      queryFn: ({ pageParam }) =>
        trpc.get.featuredPlaylists.query({ page: pageParam, n: 50, lang }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.last_page ? null : allPages.length + 1,
      initialData: { pages: [initialPlaylists], pageParams: [1] },
    });

  const featuredPlaylists = uniqueBy(
    data.pages.flatMap((page) => page.data),
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
