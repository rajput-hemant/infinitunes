import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the mix page: header, then its songs. */
export default function MixDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="mix" />

      <SongListSkeleton length={20} />
    </div>
  );
}
