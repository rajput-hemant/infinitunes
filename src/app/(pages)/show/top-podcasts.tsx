"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { TopShows } from "@/types";
import { getTopShows } from "@/lib/jiosaavn-api";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { ItemCard } from "@/components/item-card";
import { H3 } from "@/components/ui/topography";

type Props = {
  initialTopShows: TopShows;
};

const TopPodcasts = ({ initialTopShows: { data, last_page } }: Props) => {
  const [podcasts, setPodcasts] = useState(data);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!last_page);

  const ref = useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(ref, {})?.isIntersecting;

  useEffect(() => {
    if (isLoadMoreVisible) {
      (async () => {
        setIsLoading(true);
        const topShows = await getTopShows(page, 50);
        setPodcasts((p) => [...p, ...topShows.data]);
        setPage((page) => page + 1);
        setHasMore(topShows.last_page);

        console.log(topShows.last_page);

        setIsLoading(false);
      })();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {podcasts.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <ItemCard
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

export default TopPodcasts;
