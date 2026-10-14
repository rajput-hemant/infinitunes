"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { usePathname } from "next/navigation";

import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { SliderCardSkeleton } from "~/components/slider/slider-card-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

const ALBUM_CARD_COUNT = 12;

/**
 * Mirrors the label page: header, the Songs and Albums switch, then the list
 * or grid the `-songs` slug selects. Client-side only to read that slug.
 */
export default function LabelDetailsLoading() {
  const name = usePathname().split("/")[2] ?? "";

  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="label" />

      <div className="flex flex-col gap-2">
        <Skeleton className="mx-auto h-8 w-32 rounded-lg lg:mx-0" />

        {name.endsWith("-songs") ? (
          <SongListSkeleton length={20} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6 max-sm:gap-4">
            {Array.from({ length: ALBUM_CARD_COUNT }).map((_, i) => (
              <SliderCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
