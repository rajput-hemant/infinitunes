import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function AlbumDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeaderSkeleton type="album" />

      <SongListSkeleton showAlbum={false} />

      <SliderListSkeleton />
    </div>
  );
}
