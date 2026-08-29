import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function SongDetailsLoading() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="song" />

      <div className="space-y-2 border-b py-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-5 w-80" />
      </div>

      <Skeleton className="h-10 w-72" />
      <Separator />

      <SongListSkeleton length={10} />
    </div>
  );
}
