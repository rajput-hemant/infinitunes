"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import type { TopShows } from "@/types";

import { SliderCard } from "@/components/slider";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getTopShows } from "@/lib/jiosaavn-api";

type TopPodcastsProps = {
  initialTopShows: TopShows;
};

export function TopPodcasts({ initialTopShows }: TopPodcastsProps) {
  const { data, last_page } = initialTopShows;

  const [podcasts, setPodcasts] = React.useState(data);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(!last_page);

  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(loadMoreRef, {})
    ?.isIntersecting;

  React.useEffect(() => {
    if (isLoadMoreVisible) {
      (async () => {
        setIsLoading(true);
        const nextPage = page + 1;
        const topShows = await getTopShows(nextPage, 50);
        setPodcasts((p) => [...p, ...topShows.data]);
        setPage(nextPage);
        setHasMore(topShows.last_page);
        setIsLoading(false);
      })();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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
          />
        ))}
      </div>

      {hasMore ?
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center gap-2 font-bold text-muted-foreground"
        >
          {isLoading && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      : <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em> 🤩
        </h3>
      }
    </>
  );
}
