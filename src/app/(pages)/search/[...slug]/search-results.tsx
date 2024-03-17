"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type {
  AlbumSearch,
  ArtistSearch,
  PlaylistSearch,
  PodcastSearch,
  Song,
  SongSearch,
} from "@/types";

import { ItemCard } from "@/components/item-card";
import { SongList } from "@/components/song/song-list";
import { H3 } from "@/components/ui/topography";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { search } from "@/lib/jiosaavn-api";

type Props = {
  query: string;
  type: "song" | "album" | "playlist" | "artist" | "show";
  initialSearchResults:
    | SongSearch
    | AlbumSearch
    | PlaylistSearch
    | ArtistSearch
    | PodcastSearch;
  className?: string;
};

export const SearchResults = ({
  query,
  type,
  initialSearchResults: { results, start, total },
  className,
}: Props) => {
  const [searchResults, setSearchResults] = useState(results);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(start + results.length < total);

  const ref = useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(ref, {})?.isIntersecting;

  useEffect(() => {
    if (isLoadMoreVisible) {
      (async () => {
        setIsLoading(true);
        const response = await search(query, type, page, 50);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        setSearchResults((s) => [...s, ...response.results]);
        setPage((page) => page + 1);
        setHasMore(response.start + response.results.length < total);
        setIsLoading(false);
      })();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={className}>
      {type === "song" ?
        <SongList items={searchResults as Song[]} />
      : <div className="flex w-full flex-wrap justify-between gap-y-4">
          {searchResults.map(({ id, name, url, subtitle, type, image }) => (
            <ItemCard
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
          ref={ref}
          className="mt-4 flex items-center justify-center gap-2 font-bold text-muted-foreground"
        >
          {isLoading && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      : <H3 className="text-center">
          <em>Yay! You have seen it all</em> 🤩
        </H3>
      }
    </div>
  );
};
