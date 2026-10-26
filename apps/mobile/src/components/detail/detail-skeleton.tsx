import {
  EntityHeaderSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

type DetailSkeletonProps = {
  rows?: number;
  /** A Shuffle button beside Play (not for a single song). */
  shuffle?: boolean;
  /** The header's heart (a show or station has none). */
  download?: boolean;
  /** Numbered rows with lengths (an album's `TrackList numbered`). */
  numbered?: boolean;
  /** The shelf after the songs (a show or station has none). */
  shelf?: boolean;
};

/** The loading page of a detail screen: header, song list, one shelf. */
export function DetailSkeleton({
  rows = 6,
  shuffle = true,
  download = true,
  numbered = false,
  shelf = true,
}: DetailSkeletonProps) {
  return (
    <>
      <EntityHeaderSkeleton shuffle={shuffle} download={download} />
      <SongListSkeleton rows={rows} numbered={numbered} />
      {shelf ? <ShelfSkeleton /> : null}
    </>
  );
}
