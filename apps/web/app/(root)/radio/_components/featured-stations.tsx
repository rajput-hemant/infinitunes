"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";

import { SliderCard } from "~/components/slider";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { getFeaturedRadioStations } from "~/lib/jiosaavn-api";
import type { Lang, Radio } from "~/types";

type FeaturedStationsProps = {
  initialStations: Radio[];
  lang?: Lang;
};

export function FeaturedStations({
  initialStations,
  lang,
}: FeaturedStationsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-stations", lang],
      queryFn: ({ pageParam }) => getFeaturedRadioStations(pageParam, 50, lang),
      getNextPageParam: (stations, allPages) =>
        stations.length < 50 ? null : allPages.length + 1,
      initialPageParam: 1,
      initialData: { pages: [initialStations], pageParams: [1] },
    });

  const stations = data.pages.flatMap((page) => page);

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
        {stations.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <SliderCard
            key={id}
            name={name}
            url={url}
            subtitle={subtitle}
            type={type}
            image={image}
            explicit={explicit}
          />
        ))}
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
