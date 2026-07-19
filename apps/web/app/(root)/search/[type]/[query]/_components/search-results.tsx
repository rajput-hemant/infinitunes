"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { SliderCard } from "~/components/slider";
import { SongListClient } from "~/components/song-list/song-list.client";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";
import type { Album, SearchReturnType, Song } from "~/types";

type SearchResultsProps = {
  query: string;
  type: "song" | "album" | "playlist" | "artist" | "show";
  initialSearchResults: SearchReturnType;
};

const typeMap = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  artist: "artists",
  show: "podcasts",
} as const;

export function SearchResults(props: SearchResultsProps) {
  const { query, type, initialSearchResults } = props;

  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["search-results", type, query],
      queryFn: ({ pageParam }) =>
        utils.search.byType.fetch({
          q: query,
          type: typeMap[type],
          page: pageParam,
          n: 50,
        }),
      initialPageParam: 1 as number,
      getNextPageParam: (lastPage, allPages) =>
        allPages.length * 50 < (lastPage as SearchReturnType).total
          ? allPages.length + 1
          : undefined,
      initialData: { pages: [initialSearchResults], pageParams: [1] },
    });

  const searchResults = (data.pages as SearchReturnType[]).flatMap(
    (page) => page.results as (Album | Song)[],
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
      {type === "song" ? (
        <SongListClient items={searchResults as Song[]} />
      ) : (
        <div className="flex w-full flex-wrap justify-between gap-y-4">
          {searchResults.map(
            ({ id, title, perma_url, subtitle, type, image }) => (
              <SliderCard
                key={id}
                title={title}
                perma_url={perma_url}
                subtitle={subtitle}
                type={type}
                image={image}
              />
            ),
          )}
        </div>
      )}

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
    </>
  );
}
