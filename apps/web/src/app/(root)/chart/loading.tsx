import { SliderCardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopChartsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="mt-4 h-8 w-72 sm:h-9 md:h-10" />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} aspect="video" />
        ))}
      </div>
    </div>
  );
}
