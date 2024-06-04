"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { User } from "next-auth";
import type { Favorite, MyPlaylist } from "@/lib/db/schema";
import type { Episode, Sort } from "@/types";

import { SongListClient } from "@/components/song-list/song-list.client";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getShowEpisodes } from "@/lib/jiosaavn-api";

type EpisodeListProps = {
  user?: User;
  showId: string;
  season: number;
  sort: Sort;
  totalEpisodes: number;
  initialEpisodes: Episode[];
  userFavorites?: Favorite;
  userPlaylists?: MyPlaylist[];
};

export function EpisodeList(props: EpisodeListProps) {
  const {
    user,
    showId,
    season,
    sort,
    totalEpisodes,
    initialEpisodes,
    userFavorites,
    userPlaylists,
  } = props;

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["episodes", season, showId],
      queryFn: ({ pageParam }) =>
        getShowEpisodes(showId, season, pageParam, sort),
      getNextPageParam: (_, allPages) => {
        const allPagesLength = allPages
          .map((page) => page.length)
          .reduce((acc, curr) => acc + curr, 0);

        return allPagesLength < totalEpisodes ? allPages.length + 1 : null;
      },
      initialPageParam: 1,
      initialData: { pages: [initialEpisodes], pageParams: [1] },
    });

  const episodes = data.pages.flatMap((page) => page);

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
      <SongListClient
        user={user}
        items={episodes}
        userFavorites={userFavorites}
        userPlaylists={userPlaylists}
      />

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
