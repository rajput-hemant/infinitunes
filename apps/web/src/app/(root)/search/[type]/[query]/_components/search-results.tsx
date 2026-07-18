"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { Album, SearchReturnType, Song } from "@/types";

import { SliderCard } from "@/components/slider";
import { SongListClient } from "@/components/song-list/song-list.client";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { search } from "@/lib/jiosaavn-api";

type SearchResultsProps = {
  query: string;
  type: "song" | "album" | "playlist" | "artist" | "show";
  initialSearchResults: SearchReturnType;
};

export function SearchResults(props: SearchResultsProps) {
  const { query, type, initialSearchResults } = props;

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["search-results", type, query],
      queryFn: ({ pageParam }) => search(query, type, pageParam, 50),
      getNextPageParam: ({ total }, allPages) =>
        allPages.length * 50 < total ? allPages.length + 1 : undefined,
      initialPageParam: 1,
      initialData: { pages: [initialSearchResults], pageParams: [1] },
    });

  const searchResults = data.pages.flatMap(
    (page) => page.results as (Album | Song)[]
  );

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
      {type === "song" ?
        <SongListClient items={searchResults as Song[]} />
      : <div className="flex w-full flex-wrap justify-between gap-y-4">
          {searchResults.map(({ id, name, url, subtitle, type, image }) => (
            <SliderCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type={type}
              image={image}
            />
          ))}
        </div>
      }

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
      : <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      }
    </>
  );
}
