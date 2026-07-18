import { SliderCardSkeleton } from "@/components/skeletons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopPodcastsLoading() {
  return (
    <div className="space-y-4">
      <div className="mt-4 space-y-1">
        <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />
        <Skeleton className="h-6 w-32 sm:h-6 md:h-6 md:w-56" />
      </div>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {Array.from({ length: 26 }).map((_, i) => (
            <SliderCardSkeleton key={i} hideSubtitle />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {Array.from({ length: 26 }).map((_, i) => (
            <SliderCardSkeleton key={i} hideSubtitle />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
