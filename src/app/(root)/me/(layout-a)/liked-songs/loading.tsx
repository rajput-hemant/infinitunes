import { SongListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LikedSongsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72 sm:h-9" />

      <div className="space-y-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <SongListSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
