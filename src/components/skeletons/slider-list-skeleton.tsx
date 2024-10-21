import React from "react";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { SliderCardSkeleton } from "./slider-card-skeleton";

export function SliderListSkeleton({ length = 5 }) {
  return Array.from({ length }).map((_, i) => (
    <div key={i} className="pointer-events-none space-y-2">
      <Skeleton className="h-7 w-72 sm:h-8 md:h-9 lg:w-96" />

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SliderCardSkeleton key={i} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ));
}
