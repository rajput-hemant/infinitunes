"use client";

import type { Lang, Radio } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Radio as RadioIcon } from "lucide-react";
import React from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import {
  CatalogEmpty,
  CatalogEnd,
} from "~/app/(root)/browse/_components/catalog-states";
import { SliderCard } from "~/components/slider/slider-card";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
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
      initialPageParam: 1 as number,
      getNextPageParam: (stations, allPages) =>
        (stations as Radio[]).length < 50 ? null : allPages.length + 1,
      initialData: { pages: [initialStations], pageParams: [1] },
    });

  const stations = (data.pages as Radio[][]).flat();

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        fetchNextPage();
      }
    },
  });

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

      {hasNextPage ? (
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 py-6 text-sm font-medium text-muted-foreground"
        >
          {isFetchingNextPage && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      ) : (
        <CatalogEnd />
      )}
    </div>
  );
}
