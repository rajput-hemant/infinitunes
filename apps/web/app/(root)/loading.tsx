import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";

export default function HomePageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />

          <Shelf rows={2}>
            {Array.from({ length: 20 }).map((_card, j) => (
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
