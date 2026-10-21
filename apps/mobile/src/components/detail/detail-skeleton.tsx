import {
  EntityHeaderSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

type DetailSkeletonProps = {
  rows?: number;
};

/** The loading page of a detail screen: header, song list, one shelf. */
export function DetailSkeleton({ rows = 6 }: DetailSkeletonProps) {
  return (
    <>
      <EntityHeaderSkeleton />
      <SongListSkeleton rows={rows} />
      <ShelfSkeleton />
    </>
  );
}
