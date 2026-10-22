import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SliderCardSkeleton } from "~/components/slider/slider-card-skeleton";

const ALBUM_CARD_COUNT = 12;

/** Mirrors `LabelTabNav`: a line tab row, 40px tall (44px coarse), with a hairline below. */
export function LabelTabsSkeleton() {
  return (
    <div className="mb-4 box-content flex h-10 items-center gap-6 border-b border-border pointer-coarse:h-11">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-14" />
    </div>
  );
}

/** The Albums panel: the album card grid. */
export function LabelAlbumsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6 max-sm:gap-4">
      {Array.from({ length: ALBUM_CARD_COUNT }).map((_, i) => (
        <SliderCardSkeleton key={i} />
      ))}
    </div>
  );
}
