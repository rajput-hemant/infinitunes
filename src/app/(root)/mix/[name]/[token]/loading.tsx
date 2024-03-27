import {
  DetailsHeaderSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";

export default function MixDetailsLoading() {
  return (
    <div className="mb-4 space-y-4">
      <DetailsHeaderSkeleton type="mix" />
      <SongListSkeleton length={20} />
    </div>
  );
}
