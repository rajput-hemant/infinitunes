import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";

import { SliderCardSkeleton } from "./slider-card-skeleton";

const QUICK_PICK_COUNT = 8;
const SHELF_COUNT = 3;
const SHELF_CARD_COUNT = 20;

/** Mirrors the home page: hero beside quick picks, then card shelves. */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Skeleton className="min-h-60 rounded-lg md:min-h-64 xl:min-h-72" />

        <div>
          <Skeleton className="mb-3 h-7 w-28" />

          <div className="grid grid-cols-2 content-start gap-2">
            {Array.from({ length: QUICK_PICK_COUNT }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-sm md:h-14" />
            ))}
          </div>
        </div>
      </div>

      {Array.from({ length: SHELF_COUNT }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-7 w-40" />

          <Shelf rows={2}>
            {Array.from({ length: SHELF_CARD_COUNT }).map((_card, j) => (
              <ShelfItem key={j}>
                <SliderCardSkeleton />
              </ShelfItem>
            ))}
          </Shelf>
        </div>
      ))}
    </div>
  );
}
