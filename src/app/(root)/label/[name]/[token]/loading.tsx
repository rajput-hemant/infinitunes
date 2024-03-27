import {
  DetailsHeaderSkeleton,
  SliderCardSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabelDetailsLoading() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="label" />

      <Skeleton className="h-10 w-[148px]" />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <SliderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
