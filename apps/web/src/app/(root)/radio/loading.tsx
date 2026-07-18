import {
  LanguageBarSkeleton,
  SliderCardSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function RadioLoading() {
  return (
    <div className="space-y-4">
      <LanguageBarSkeleton />

      <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} rounded />
        ))}
      </div>
    </div>
  );
}
