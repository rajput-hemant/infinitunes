"use client";

import type { Lang, Radio } from "@infinitunes/types";
import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Radio as RadioIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogEmpty } from "~/app/(root)/browse/_components/catalog-states";
import { CatalogLoadMore } from "~/components/catalog-load-more";
import { QueryScope } from "~/components/query-scope";
import { FIRST_ROW_CARDS, SliderCard } from "~/components/slider/slider-card";
import { trpc } from "~/lib/trpc/vanilla";

type FeaturedStationsProps = {
  initialStations: Radio[];
  lang?: Lang;
  /** The 1-based page `initial*` holds (`?page=N`); the next request is N + 1. */
  page?: number;
};

function FeaturedStationsContent({
  initialStations,
  lang,
  page = 1,
}: FeaturedStationsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-stations", lang, page],
      queryFn: ({ pageParam }) =>
        trpc.get.featuredStations.query({ page: pageParam, n: 50, lang }),
      initialPageParam: page,
      getNextPageParam: (stations, _allPages, lastPageParam) =>
        stations.length < 50 ? null : lastPageParam + 1,
      initialData: { pages: [initialStations], pageParams: [page] },
    });

  const stations = uniqueBy(data.pages.flat(), (station) => station.id);

  if (stations.length === 0) {
    return (
      <CatalogEmpty
        icon={RadioIcon}
        title="No radio stations"
        description="Try another language or check back later."
      />
    );
  }

  return (
    <div>
      <CatalogGrid>
        {stations.map(
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

export function FeaturedStations(
  props: ComponentProps<typeof FeaturedStationsContent>,
) {
  return (
    <QueryScope>
      <FeaturedStationsContent {...props} />
    </QueryScope>
  );
}
