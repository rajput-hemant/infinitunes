import { SliderCardSkeleton } from "./slider-card-skeleton";

/** Same grid as the catalog grid, so the skeleton lands on the same cells. */
export function AlbumGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] md:gap-x-4 xl:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] min-[1920px]:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] min-[2560px]:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]">
      {Array.from({ length: 20 }).map((_, i) => (
        <SliderCardSkeleton key={i} />
      ))}
    </div>
  );
}
