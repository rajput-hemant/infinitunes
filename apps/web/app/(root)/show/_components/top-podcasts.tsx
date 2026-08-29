"use client";

import type { TopShows } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";

import { SliderCard } from "~/components/slider/slider-card";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";

type Props = {
  initialTopShows: TopShows;
};

export function TopPodcasts({ initialTopShows }: Props) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-podcasts"],
      queryFn: ({ pageParam }) =>
        utils.get.topShows.fetch({ page: pageParam, n: 50 }),
      initialPageParam: 1 as number,
      getNextPageParam: (lastPage, allPages) =>
        (lastPage as TopShows).last_page ? null : allPages.length + 1,
      initialData: { pages: [initialTopShows], pageParams: [1] },
    });

  const podcasts = (data.pages as TopShows[]).flatMap((page) => page.data);

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
        {podcasts.map(
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
              hidePlayButton
            />
          ),
        )}
      </div>

      {hasNextPage ? (
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
      ) : (
        <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      )}
    </>
  );
}
