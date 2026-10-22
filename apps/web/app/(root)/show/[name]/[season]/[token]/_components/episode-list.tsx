"use client";

import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import type { Favorite } from "@infinitunes/db/schema";
import type { Sort, SongRowItem } from "@infinitunes/types";
import { toSongRow, uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { QueryScope } from "~/components/query-scope";
import { SongListClient } from "~/components/song-list/song-list.client";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import type { User } from "~/lib/auth";
import { trpc } from "~/lib/trpc/vanilla";

type EpisodeListProps = {
  user?: User;
  showId: string;
  season: number;
  sort: Sort;
  totalEpisodes: number;
  initialEpisodes: SongRowItem[];
  userFavorites?: Favorite | null;
  userPlaylists?: PlaylistSummary[];
};

function EpisodeListContent(props: EpisodeListProps) {
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
      queryKey: ["episodes", season, showId, sort],
      queryFn: async ({ pageParam }) =>
        (
          await trpc.show.episodes.query({
            id: showId,
            season,
            page: pageParam,
            sort,
          })
        ).map(toSongRow),
      initialPageParam: 1,
      getNextPageParam: (_, allPages) => {
        const allPagesLength = allPages
          .map((page) => page.length)
          .reduce((acc, curr) => acc + curr, 0);

        return allPagesLength < totalEpisodes ? allPages.length + 1 : null;
      },
      initialData: { pages: [initialEpisodes], pageParams: [1] },
    });

  const episodes = uniqueBy(data.pages.flat(), (episode) => episode.id);

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

      {hasNextPage && (
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
      )}
    </>
  );
}

export function EpisodeList(props: ComponentProps<typeof EpisodeListContent>) {
  return (
    <QueryScope>
      <EpisodeListContent {...props} />
    </QueryScope>
  );
}
