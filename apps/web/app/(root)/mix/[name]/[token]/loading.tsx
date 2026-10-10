import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function MixDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeaderSkeleton type="mix" />
      <SongListSkeleton length={20} />
    </div>
  );
}
