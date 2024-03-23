"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import type { Lang, TopAlbum } from "@/types";

import { SliderCard } from "@/components/slider";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getTopAlbums } from "@/lib/jiosaavn-api";

type TopAlbumsProps = {
  initialAlbums: TopAlbum;
  lang?: Lang;
};

export function TopAlbums({ initialAlbums, lang }: TopAlbumsProps) {
  const { data, last_page } = initialAlbums;

  const [topAlbums, setTopAlbums] = React.useState(data);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(!last_page);

  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const isLoadMoreVisible = !!useIntersectionObserver(loadMoreRef, {})
    ?.isIntersecting;

  async function loadMoreAlbums() {
    setIsLoading(true);
    const nextPage = page + 1;
    const albums = await getTopAlbums(nextPage, 50, lang);
    setTopAlbums((prevAlbums) => [...prevAlbums, ...albums.data]);
    setPage(nextPage);
    setHasMore(!albums.last_page);
    setIsLoading(false);
  }

  React.useEffect(() => {
    if (isLoadMoreVisible) {
      loadMoreAlbums();
    }
  }, [isLoadMoreVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {topAlbums.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <SliderCard
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
