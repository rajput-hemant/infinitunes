"use client";

import { Badge } from "@infinitunes/ui/components/badge";
import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { usePathname } from "next/navigation";
import React from "react";

import { AlbumGridSkeleton } from "~/components/skeletons/album-grid-skeleton";
import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function ArtistDetailsSkeleton() {
  const name = usePathname().split("/")[2];

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeaderSkeleton type="artist" />
      <Skeleton className="h-10 w-[284px]" />
      <Separator className="my-4" />
      <div className="mt-2">
        {/-(songs|albums)$/.test(name) ? (
          <div className="my-6 flex space-x-2">
            <Badge className="p-2 px-4 text-primary">Popular</Badge>
            <Badge variant="secondary" className="p-2 px-4 text-secondary">
              Date
            </Badge>
            <Badge variant="secondary" className="p-2 px-4 text-secondary">
              Name
            </Badge>
          </div>
        ) : (
          <Skeleton className="h-10 w-[138px]" />
        )}
        {/-albums$/.test(name) ? (
          <AlbumGridSkeleton />
        ) : (
          <SongListSkeleton length={10} />
        )}
      </div>
    </div>
  );
}
