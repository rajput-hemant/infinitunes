import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { Shelf } from "../slider/shelf";
import { ShelfItem } from "../slider/shelf-item";
import { SliderCardSkeleton } from "./slider-card-skeleton";

export function SliderListSkeleton({ length = 5 }) {
  return Array.from({ length }).map((_, i) => (
    <div key={i} className="pointer-events-none space-y-3">
      <Skeleton className="h-7 w-72 lg:w-96" />

      <Shelf>
        {Array.from({ length: 12 }).map((_card, j) => (
          <ShelfItem key={j}>
            <SliderCardSkeleton />
          </ShelfItem>
        ))}
      </Shelf>
    </div>
  ));
}
