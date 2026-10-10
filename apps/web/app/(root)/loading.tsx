import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function HomePageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />

          <ScrollArea>
            <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 xl:pb-6">
              {Array.from({ length: 20 }).map((_card, j) => (
                <SliderCardSkeleton key={j} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
