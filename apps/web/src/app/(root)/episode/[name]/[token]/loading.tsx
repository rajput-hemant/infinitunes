import { DetailsHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodeDetailsLoading() {
  return (
    <div className="mb-4 space-y-4">
      <DetailsHeaderSkeleton type="episode" />

      <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />

      <div className="flex w-full max-w-3xl flex-col gap-1">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-72" />
      </div>
    </div>
  );
}
