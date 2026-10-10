"use client";

import type { FeaturedPlaylists, Lang } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogEnd } from "~/app/(root)/browse/_components/catalog-states";
import { SliderCard } from "~/components/slider/slider-card";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { api } from "~/lib/trpc/client";

type Props = {
  initialPlaylists: FeaturedPlaylists;
  lang?: Lang;
};

export function FeaturedPlaylists({ initialPlaylists, lang }: Props) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["featured-playlists", lang],
      queryFn: ({ pageParam }) =>
        utils.get.featuredPlaylists.fetch({ page: pageParam, n: 50, lang }),
      initialPageParam: 1 as number,
      getNextPageParam: (lastPage, allPages) =>
        (lastPage as FeaturedPlaylists).last_page ? null : allPages.length + 1,
      initialData: { pages: [initialPlaylists], pageParams: [1] },
    });

  const featuredPlaylists = (data.pages as FeaturedPlaylists[]).flatMap(
    (page) => page.data,
  );

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
        {featuredPlaylists.map(
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
