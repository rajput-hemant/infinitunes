import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { PageSectionTitleSkeleton } from "~/components/page-section-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Mirrors the episodes section: title and sort menu on one row, then the list. */
export function EpisodesSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <PageSectionTitleSkeleton className="ml-0" />

        <Skeleton className={cn(controlStyles.text, "w-28 md:w-36")} />
      </div>

      <SongListSkeleton length={10} />
    </>
  );
}
