import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function Page() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
