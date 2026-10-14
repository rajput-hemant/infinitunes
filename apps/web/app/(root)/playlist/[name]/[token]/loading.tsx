import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { SliderListSkeleton } from "~/components/slider/shelf-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the playlist page: header, tracks, two recommendation shelves, artists. */
export default function PlaylistDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="playlist" />

      <SongListSkeleton length={20} />

      <SliderListSkeleton sections={2} />

      <SliderListSkeleton rounded hideSubtitle />
    </div>
  );
}
