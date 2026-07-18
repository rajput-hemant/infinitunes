import {
  DetailsHeaderSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
