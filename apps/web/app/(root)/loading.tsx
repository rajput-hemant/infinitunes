import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";

import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function HomePageSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="mb-4 space-y-4">
      <div className="border-b pb-2" />

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start sm:gap-2 xl:pb-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <SliderCardSkeleton key={i} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ));
}
