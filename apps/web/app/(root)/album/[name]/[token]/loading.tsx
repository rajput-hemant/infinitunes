import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { SliderListSkeleton } from "~/components/slider/shelf-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the album page: header, tracks, three recommendation shelves, artists. */
export default function AlbumDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="album" />

      <SongListSkeleton showAlbum={false} length={10} />

      <SliderListSkeleton sections={3} />

      <SliderListSkeleton rounded hideSubtitle />
    </div>
  );
}
