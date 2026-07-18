"use client";

import React from "react";
import { usePathname } from "next/navigation";

import {
  DetailsHeaderSkeleton,
  SliderCardSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistDetailsSkeleton() {
  const name = usePathname().split("/")[2];

  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="artist" />
      <Skeleton className="h-10 w-[284px]" />
      <Separator className="my-4" />
      <div className="mt-2">
        {/-(songs|albums)$/.test(name) ?
          <div className="my-6 flex space-x-2">
            <Badge className="p-2 px-4 text-primary">Popular</Badge>
            <Badge variant="secondary" className="p-2 px-4 text-secondary">
              Date
            </Badge>
            <Badge variant="secondary" className="p-2 px-4 text-secondary">
              Name
            </Badge>
          </div>
        : <Skeleton className="h-10 w-[138px]" />}
        {/-albums$/.test(name) ?
          <div className="flex w-full flex-wrap justify-between gap-y-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <SliderCardSkeleton key={i} />
            ))}
          </div>
        : <SongListSkeleton length={10} />}
      </div>
    </div>
  );
}
