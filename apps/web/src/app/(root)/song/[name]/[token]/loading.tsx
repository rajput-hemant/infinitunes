import { Separator } from "@infinitunes/ui/separator";
import { Skeleton } from "@infinitunes/ui/skeleton";

import {
  DetailsHeaderSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";

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
