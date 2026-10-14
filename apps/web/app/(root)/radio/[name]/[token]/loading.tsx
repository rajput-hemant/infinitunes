import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { PageSectionTitleSkeleton } from "~/components/page-section-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the station page: round artwork beside the caption, then "Coming up". */
export default function RadioStationLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <Skeleton className="aspect-square w-44 shrink-0 rounded-full md:w-56 xl:w-64" />

        <div className="flex w-full flex-col items-center justify-center lg:items-start lg:gap-2 lg:p-1">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-64 max-w-full sm:h-9 md:h-10" />
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-48" />
          </div>

          <div className="mt-4 flex gap-2 lg:mt-6">
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <PageSectionTitleSkeleton />

        <SongListSkeleton showAlbum={false} length={20} />
      </section>
    </div>
  );
}
