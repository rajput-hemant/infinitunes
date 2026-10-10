"use client";

import type { Lang, Radio } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Radio as RadioIcon } from "lucide-react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogEmpty } from "~/app/(root)/browse/_components/catalog-states";
import { CatalogLoadMore } from "~/components/catalog-load-more";
import { SliderCard } from "~/components/slider/slider-card";
import { api } from "~/lib/trpc/client";

type FeaturedStationsProps = {
  initialStations: Radio[];
  lang?: Lang;
};

export function FeaturedStations({
  initialStations,
  lang,
}: FeaturedStationsProps) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-stations", lang],
      queryFn: ({ pageParam }) =>
        utils.get.featuredStations.fetch({ page: pageParam, n: 50, lang }),
      initialPageParam: 1,
      getNextPageParam: (stations, allPages) =>
        stations.length < 50 ? null : allPages.length + 1,
      initialData: { pages: [initialStations], pageParams: [1] },
    });

  const stations = data.pages.flat();

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
