"use client";

import type { Lang, TopAlbum } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogEnd } from "~/app/(root)/browse/_components/catalog-states";
import { SliderCard } from "~/components/slider/slider-card";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";

type TopAlbumsProps = {
  initialAlbums: TopAlbum;
  lang?: Lang;
};

export function TopAlbums({ initialAlbums, lang }: TopAlbumsProps) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["top-albums", lang],
      queryFn: ({ pageParam }) =>
        utils.get.topAlbums.fetch({ page: pageParam, n: 50, lang }),
      initialPageParam: 1 as number,
      getNextPageParam: (lastPage, allPages) =>
        (lastPage as TopAlbum).last_page ? null : allPages.length + 1,
      initialData: { pages: [initialAlbums], pageParams: [1] },
    });

  const topAlbums = (data.pages as TopAlbum[]).flatMap((page) => page.data);

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        fetchNextPage();
      }
    },
  });

  return (
    <div>
      <CatalogGrid>
        {topAlbums.map(
          ({
            id,
            title,
            perma_url,
            subtitle,
            type,
            image,
            explicit_content,
          }) => (
            <SliderCard
              key={id}
              name={title}
              url={perma_url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit_content}
            />
          ),
        )}
      </CatalogGrid>

      {hasNextPage ? (
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 py-6 text-sm font-medium text-muted-foreground"
        >
          {isFetchingNextPage && (
            <>
              <Loader2 className="size-5 animate-spin" /> Loading...
            </>
          )}
        </div>
      ) : (
        <CatalogEnd />
      )}
    </div>
  );
}
