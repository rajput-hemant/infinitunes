import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Mirrors a saved playlist: collage beside the caption, then its songs. */
export default function MyPlaylistLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <div className="flex flex-col items-center gap-5 lg:flex-row lg:gap-10">
        <Skeleton className="aspect-square w-44 shrink-0 rounded-lg md:w-56 xl:w-64" />

        <div className="flex w-full min-w-0 flex-col items-center gap-2 lg:items-start">
          <Skeleton className="h-8 w-64 max-w-full sm:h-9 md:h-10" />

          <div className="flex h-6 items-center">
            <Skeleton className="h-3.5 w-36" />
          </div>

          <div className="mt-2 flex gap-2">
            <Skeleton className={cn(controlStyles.hero, "w-24")} />
          </div>
        </div>
      </div>

      <SongListSkeleton length={12} />
    </div>
  );
}
