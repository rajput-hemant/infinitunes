"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";

import { SliderCard } from "~/components/slider";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";
import type { Lang, Radio } from "~/types";

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

  const stations = data.pages as Radio[];

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        fetchNextPage();
      }
    },
  });

  return (
    <div className="py-6">
      <div className="flex w-full flex-wrap justify-between gap-y-4">
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
              title={title}
              perma_url={perma_url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit_content}
            />
          ),
        )}
      </div>

      {hasNextPage ? (
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 font-bold text-muted-foreground"
        >
          {isFetchingNextPage && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      ) : (
        <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      )}
    </div>
  );
}
