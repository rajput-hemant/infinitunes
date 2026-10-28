"use client";

import type { Lang, TopAlbum } from "@infinitunes/types";
import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";

import { CatalogLoadMore } from "~/components/catalog-load-more";
import { CatalogGrid } from "~/components/catalog/catalog-grid";
import { QueryScope } from "~/components/query-scope";
import { FIRST_ROW_CARDS, SliderCard } from "~/components/slider/slider-card";
import { trpc } from "~/lib/trpc/vanilla";

type TopAlbumsProps = {
  initialAlbums: TopAlbum;
  lang?: Lang;
  /** The 1-based page `initial*` holds (`?page=N`); the next request is N + 1. */
  page?: number;
};

function TopAlbumsContent({ initialAlbums, lang, page = 1 }: TopAlbumsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-albums", lang, page],
      queryFn: ({ pageParam }) =>
        trpc.get.topAlbums.query({ page: pageParam, n: 50, lang }),
      initialPageParam: page,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.last_page ? null : lastPageParam + 1,
      initialData: { pages: [initialAlbums], pageParams: [page] },
    });

  const topAlbums = uniqueBy(
    data.pages.flatMap((group) => group.data),
    (album) => album.id,
  );

  return (
    <div>
      <CatalogGrid>
        {topAlbums.map(
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

export function TopAlbums(props: ComponentProps<typeof TopAlbumsContent>) {
  return (
    <QueryScope seed={props.initialAlbums}>
      <TopAlbumsContent {...props} />
    </QueryScope>
  );
}
