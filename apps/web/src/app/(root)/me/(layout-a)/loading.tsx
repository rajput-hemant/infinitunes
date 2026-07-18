import { SliderCardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72 sm:h-9" />

      <div className="flex w-full flex-wrap gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <SliderCardSkeleton key={i} hideSubtitle />
        ))}
      </div>
    </div>
  );
}
