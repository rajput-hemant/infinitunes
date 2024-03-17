"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { TopAlbum } from "@/types";

import { ItemCard } from "@/components/item-card";
import { H3 } from "@/components/ui/topography";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getTopAlbums } from "@/lib/jiosaavn-api";

type Props = {
  initialAlbums: TopAlbum;
};

const TopAlbums = ({ initialAlbums: { data, last_page } }: Props) => {
  const [topAlbums, setTopAlbums] = useState(data);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!last_page);

  const ref = useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(ref, {})?.isIntersecting;

  useEffect(() => {
    if (isLoadMoreVisible) {
      (async () => {
        setIsLoading(true);
        const albums = await getTopAlbums(page, 50);
        setTopAlbums((s) => [...s, ...albums.data]);
        setPage((page) => page + 1);
        setHasMore(!albums.last_page);
        setIsLoading(false);
      })();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {topAlbums.map(({ id, name, url, subtitle, type, image, explicit }) => (
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

      {hasMore ?
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 font-bold text-muted-foreground"
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
    </>
  );
};

export default TopAlbums;
