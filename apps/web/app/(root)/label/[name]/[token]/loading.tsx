"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { usePathname } from "next/navigation";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function LabelDetailsLoading() {
  const [_, name] = usePathname().split("/").slice(1);

  return (
    <div className="space-y-2">
      <DetailsHeaderSkeleton type="label" />

      <Skeleton className="h-10 w-[148px]" />

      {name.endsWith("-songs") ? (
        <SongListSkeleton length={20} />
      ) : (
        <div className="flex w-full flex-wrap justify-between gap-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <SliderCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
