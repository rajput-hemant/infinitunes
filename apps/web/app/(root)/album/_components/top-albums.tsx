"use client";

import type { Lang, TopAlbum } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogLoadMore } from "~/components/catalog-load-more";
import { SliderCard } from "~/components/slider/slider-card";
import { api } from "~/lib/trpc/client";

type TopAlbumsProps = {
  initialAlbums: TopAlbum;
  lang?: Lang;
};

export function TopAlbums({ initialAlbums, lang }: TopAlbumsProps) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-albums", lang],
      queryFn: ({ pageParam }) =>
        utils.get.topAlbums.fetch({ page: pageParam, n: 50, lang }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.last_page ? null : allPages.length + 1,
      initialData: { pages: [initialAlbums], pageParams: [1] },
    });

  const topAlbums = data.pages.flatMap((page) => page.data);

  return (
    <div>
      <CatalogGrid>
        {topAlbums.map(
          ({
            id,
            title,
            perma_url,
            subtitle,
            type,
            image,
            explicit_content,
          }) => (
            <SliderCard
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
