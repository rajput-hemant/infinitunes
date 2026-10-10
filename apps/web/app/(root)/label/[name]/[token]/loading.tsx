"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { usePathname } from "next/navigation";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function LabelDetailsLoading() {
  const [, name] = usePathname().split("/").slice(1);

  return (
    <div className="space-y-2">
      <DetailsHeaderSkeleton type="label" />

      <Skeleton className="h-10 w-[148px]" />

      {name.endsWith("-songs") ? (
        <SongListSkeleton length={20} />
      ) : (
        <CatalogGrid>
          {Array.from({ length: 20 }).map((_card, cardIndex) => (
            <SliderCardSkeleton key={cardIndex} />
          ))}
        </CatalogGrid>
      )}
    </div>
  );
}
