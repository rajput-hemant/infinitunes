import {
  EntityHeaderSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

type DetailSkeletonProps = {
  rows?: number;
  /** A Shuffle button beside Play (not for a single song). */
  shuffle?: boolean;
};

/** The loading page of a detail screen: header, song list, one shelf. */
export function DetailSkeleton({
  rows = 6,
  shuffle = true,
}: DetailSkeletonProps) {
  return (
    <>
      <EntityHeaderSkeleton shuffle={shuffle} />
      <SongListSkeleton rows={rows} />
      <ShelfSkeleton />
    </>
  );
}
