import { SliderCardSkeleton } from "@/components/skeletons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePageSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="mb-4 space-y-4">
      <div className="border-b pb-2">
        <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />
      </div>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start pb-6 sm:gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <SliderCardSkeleton key={i} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ));
}
