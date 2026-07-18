import {
  DetailsHeaderSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";

export default function Page() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
