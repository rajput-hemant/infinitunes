"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { TopShows } from "@/types";

import { SliderCard } from "@/components/slider";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getTopShows } from "@/lib/jiosaavn-api";

type Props = {
  initialTopShows: TopShows;
};

export function TopPodcasts({ initialTopShows }: Props) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-podcasts"],
      queryFn: ({ pageParam }) => getTopShows(pageParam, 50),
      getNextPageParam: ({ last_page }, allPages) =>
        last_page ? null : allPages.length + 1,
      initialPageParam: 1,
      initialData: { pages: [initialTopShows], pageParams: [1] },
    });

  const podcasts = data.pages.flatMap((page) => page.data);

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        fetchNextPage();
      }
    },
  });

  return (
    <>
      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {podcasts.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <SliderCard
            key={id}
            name={name}
            url={url}
            subtitle={subtitle}
            type={type}
            image={image}
            explicit={explicit}
            hidePlayButton
          />
        ))}
      </div>

      {hasNextPage ?
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 py-6 font-bold text-muted-foreground"
        >
          {isFetchingNextPage && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      : <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      }
    </>
  );
}
