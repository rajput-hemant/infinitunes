import React from "react";
import { Heart, MoreVertical } from "lucide-react";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { SliderListSkeleton } from "./slider-list-skeleton";

export function AlbumDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="aspect-square w-44 rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64">
          <Skeleton className="size-full" />
        </div>

        <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-2">
          <Skeleton className="h-11 w-96" />

          <div className="space-y-2 text-sm text-muted-foreground">
            <Skeleton className="h-[17px] w-64" />
            <Skeleton className="h-[17px] w-40" />
          </div>

          <div className="mt-4 flex gap-2 lg:mt-6">
            <Button className="rounded-full px-10 text-xl font-bold shadow-sm">
              Play
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <Heart className="size-5 text-inherit" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <MoreVertical className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-muted-foreground">
        {Array.from({ length: 1 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-full cursor-pointer items-center justify-between rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-sm"
          >
            <div className="hidden w-[6%] lg:flex lg:justify-center xl:w-[4%]">
              <span className="truncate font-medium">{i + 1}</span>
            </div>

            <div className="flex w-[82%] items-center justify-between gap-4 xl:w-[86%] 2xl:w-[88%]">
              <div className="flex w-[calc(100%-2.5rem)] flex-col lg:flex-row">
                <div className="w-full">
                  <Skeleton className="h-5 w-72" />
                </div>
                <div className="w-full">
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </div>

            <div className="flex w-[12%] items-center justify-end lg:justify-between xl:w-[10%] 2xl:w-[8%]">
              <Heart className="size-5 text-inherit" />
              <Skeleton className="h-5 w-[38.5px]" />
              <MoreVertical className="size-5" />
            </div>
          </div>
        ))}
      </div>

      <SliderListSkeleton />
    </div>
  );
}
