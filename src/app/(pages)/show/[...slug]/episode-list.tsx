"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Episode, Sort } from "@/types";
import { getShowEpisodes } from "@/lib/jiosaavn-api";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { SongList } from "@/components/song/song-list";
import { H3 } from "@/components/ui/topography";

type Props = {
  showId: string;
  season: number;
  sort: Sort;
  totalEpisodes: number;
  initialEpisodes: Episode[];
};

export const EpisodeList = ({
  showId,
  season,
  sort,
  totalEpisodes,
  initialEpisodes,
}: Props) => {
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    totalEpisodes > initialEpisodes.length
  );

  const ref = useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(ref, {})?.isIntersecting;

  useEffect(() => {
    if (isLoadMoreVisible) {
      (async () => {
        setIsLoading(true);
        const response = await getShowEpisodes(showId, season, page, sort);
        setEpisodes((episodes) => [...episodes, ...response]);
        setPage((page) => page + 1);
        setHasMore(totalEpisodes > episodes.length);
        setIsLoading(false);
      })();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SongList items={episodes} />

      {hasMore ? (
        <div
          ref={ref}
          className="text-muted-foreground flex items-center justify-center gap-2 font-bold"
        >
          {isLoading && (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      ) : (
        <H3 className="text-center">
          <em>Yay! You have seen it all</em> 🤩
        </H3>
      )}
    </>
  );
};
