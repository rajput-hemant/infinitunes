import {
  LibraryHeadingSkeleton,
  LibraryToolbarSkeleton,
} from "~/components/library/library-heading-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the library song list: heading, the filter toolbar, then the list. */
export default function LikedSongsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <LibraryHeadingSkeleton />

      <div>
        <LibraryToolbarSkeleton />

        <SongListSkeleton length={12} />
      </div>
    </div>
  );
}
