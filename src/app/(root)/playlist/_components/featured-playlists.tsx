"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { FeaturedPlaylists, Lang } from "@/types";

import { SliderCard } from "@/components/slider";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getFeaturedPlaylists } from "@/lib/jiosaavn-api";

type Props = {
  initialPlaylists: FeaturedPlaylists;
  lang?: Lang;
};

export function FeaturedPlaylists({ initialPlaylists, lang }: Props) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-playlists", lang],
      queryFn: ({ pageParam }) => getFeaturedPlaylists(pageParam, 50, lang),
      getNextPageParam: ({ last_page }, allPages) =>
        last_page ? null : allPages.length + 1,
      initialPageParam: 1,
      initialData: { pages: [initialPlaylists], pageParams: [1] },
    });

  const featuredPlaylists = data.pages.flatMap((page) => page.data);

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
        {featuredPlaylists.map(
          ({ id, name, url, subtitle, type, image, explicit }) => (
            <SliderCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit}
            />
          )
        )}
      </div>

      {hasNextPage ?
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
      : <h3 className="text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      }
    </div>
  );
}
