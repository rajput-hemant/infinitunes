"use client";

import type { TopShows } from "@infinitunes/types";
import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";

import { CatalogLoadMore } from "~/components/catalog-load-more";
import { CatalogGrid } from "~/components/catalog/catalog-grid";
import { QueryScope } from "~/components/query-scope";
import { FIRST_ROW_CARDS, SliderCard } from "~/components/slider/slider-card";
import { trpc } from "~/lib/trpc/vanilla";

type TopPodcastsProps = {
  initialTopShows: TopShows;
  /** The 1-based page `initial*` holds (`?page=N`); the next request is N + 1. */
  page?: number;
};

function TopPodcastsContent({ initialTopShows, page = 1 }: TopPodcastsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-podcasts", page],
      queryFn: ({ pageParam }) =>
        trpc.get.topShows.query({ page: pageParam, n: 50 }),
      initialPageParam: page,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.last_page ? null : lastPageParam + 1,
      initialData: { pages: [initialTopShows], pageParams: [page] },
    });

  const podcasts = uniqueBy(
    data.pages.flatMap((group) => group.data),
    (show) => show.id,
  );

  return (
    <>
      <CatalogGrid>
        {podcasts.map(
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
              hidePlayButton
            />
          ),
        )}
      </CatalogGrid>

      <CatalogLoadMore
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </>
  );
}

export function TopPodcasts(props: ComponentProps<typeof TopPodcastsContent>) {
  return (
    <QueryScope>
      <TopPodcastsContent {...props} />
    </QueryScope>
  );
}
