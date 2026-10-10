import React from "react";

import { SliderCardSkeleton } from "./slider-card-skeleton";

export function AlbumGridSkeleton() {
  return (
    <div className="flex w-full flex-wrap justify-between gap-y-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <SliderCardSkeleton key={i} />
      ))}
    </div>
  );
}
