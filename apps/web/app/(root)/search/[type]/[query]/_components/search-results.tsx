"use client";

import type { Album, SearchReturnType, Song } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, SearchX } from "lucide-react";

import { LibraryEmpty } from "~/components/library/library-section";
import { searchUi } from "~/components/search/search-ui";
import { SliderCard } from "~/components/slider/slider-card";
import { SongListClient } from "~/components/song-list/song-list.client";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";

import { SEARCH_TYPE_MAP } from "./type-map";

type SearchResultsProps = {
  query: string;
  type: "song" | "album" | "playlist" | "artist" | "show";
  initialSearchResults: SearchReturnType;
};

export function SearchResults(props: SearchResultsProps) {
  const { query, type, initialSearchResults } = props;

  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["search-results", type, query],
      queryFn: ({ pageParam }) =>
        utils.search.byType.fetch({
          q: query,
          type: SEARCH_TYPE_MAP[type],
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

  if (!searchResults.length) {
    return (
      <LibraryEmpty
        icon={SearchX}
        title="No results found"
        description={`Nothing matched "${query.replaceAll("%20", " ")}". Check the spelling or try a different search.`}
      />
    );
  }

  return (
    <>
      {type === "song" ? (
        <SongListClient items={searchResults as Song[]} />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] md:gap-x-4 md:gap-y-6">
          {searchResults.map((result) => (
            <SliderCard
              key={result.id}
              name={result.title}
              url={result.perma_url}
              subtitle={result.subtitle}
              type={result.type}
              image={result.image}
              className="w-full min-w-0 shrink"
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground"
        >
          {isFetchingNextPage ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading...
            </>
          ) : null}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          You have reached the end of these results.
        </p>
      )}
    </>
  );
}
