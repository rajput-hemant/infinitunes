import { Skeleton } from "@infinitunes/ui/components/skeleton";

import {
  albumCellVisibility,
  artistCellVisibility,
  songRowGrid,
} from "~/components/song-list/row-grid";
import { SongListHead } from "~/components/song-list/song-list-head";
import { cn } from "~/lib/utils";

type SongListSkeletonProps = {
  length?: number;
  showAlbum?: boolean;
};

export function SongListSkeleton(props: SongListSkeletonProps) {
  const { length = 1, showAlbum = true } = props;
  return (
    <div className="pointer-events-none @container">
      <SongListHead showAlbum={showAlbum} />

      {Array.from({ length }).map((_, i) => (
        <div key={i} className={cn(songRowGrid, "h-row px-1 md:px-2")}>
          <div className="hidden justify-center md:flex">
            <Skeleton className="h-3 w-4" />
          </div>

          <div className="flex min-w-0 items-center gap-3">
            {showAlbum && (
              <Skeleton className="size-art shrink-0 rounded-[calc(var(--r-sm)*0.75)]" />
            )}

            <div className="grid min-w-0 flex-1 gap-1.5">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>

          <div className={artistCellVisibility}>
            <Skeleton className="h-3 w-3/4" />
          </div>

          <div className={albumCellVisibility}>
            {showAlbum && <Skeleton className="h-3 w-3/4" />}
          </div>

          <div className="hidden justify-end md:flex">
            <Skeleton className="h-3 w-8" />
          </div>

          <div className="flex justify-end">
            <Skeleton className="size-(--ctl) rounded-(--r-ctl)" />
          </div>
        </div>
      ))}
    </div>
  );
}
