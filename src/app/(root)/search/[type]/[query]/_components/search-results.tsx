"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { SearchReturnType, Song } from "@/types";

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
  const {
    query,
    type,
    initialSearchResults: { results, start, total },
  } = props;

  const [searchResults, setSearchResults] = useState(results);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(start + results.length < total);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(loadMoreRef, {})
    ?.isIntersecting;

  async function loadMoreSearchResults() {
    setIsLoading(true);
    const nextPage = page + 1;
    const { results, start, total } = await search(query, type, nextPage, 50);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setSearchResults((s) => [...s, ...results]);
    setPage(nextPage);
    setHasMore(start + results.length < total);
    setIsLoading(false);
  }

  useEffect(() => {
    if (isLoadMoreVisible) {
      loadMoreSearchResults();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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
