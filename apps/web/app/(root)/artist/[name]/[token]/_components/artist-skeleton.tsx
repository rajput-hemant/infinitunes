import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { PageSectionTitleSkeleton } from "~/components/page-section-skeleton";
import { SliderListSkeleton } from "~/components/slider/shelf-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

const TAB_WIDTHS = ["w-20", "w-12", "w-14", "w-20"] as const;

/** Mirrors `ArtistsTabList`: a line tab row, 40px tall (44px coarse), with a hairline below. */
export function ArtistTabsSkeleton() {
  return (
    <div className="mb-4 box-content flex h-10 items-center gap-6 border-b border-border pointer-coarse:h-11">
      {TAB_WIDTHS.map((width, i) => (
        <Skeleton key={i} className={`h-4 ${width}`} />
      ))}
    </div>
  );
}

/** Mirrors `CategoryFilter`: three 20px badges with 24px above and below. */
export function CategoryFilterSkeleton() {
  return (
    <div className="my-6 flex h-[1.3125rem] items-end gap-2">
      <Skeleton className="h-5 w-16 rounded-4xl" />
      <Skeleton className="h-5 w-12 rounded-4xl" />
      <Skeleton className="h-5 w-14 rounded-4xl" />
    </div>
  );
}

type ArtistBodySkeletonProps = {
  tab: "overview" | "songs" | "albums";
};

/** The tab row and the selected tab's body, then the shelves below the tabs. */
export function ArtistBodySkeleton({ tab }: ArtistBodySkeletonProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <ArtistTabsSkeleton />

        {tab === "overview" && (
          <div className="flex flex-col gap-(--page-gap)">
            <PageSectionTitleSkeleton />
            <SongListSkeleton length={10} />
          </div>
        )}

        {tab === "songs" && (
          <div>
            <CategoryFilterSkeleton />
            <SongListSkeleton length={10} />
          </div>
        )}

        {tab === "albums" && (
          <div>
            <CategoryFilterSkeleton />
            <CatalogGridSkeleton count={20} />
          </div>
        )}
      </div>

      <SliderListSkeleton sections={3} />
    </>
  );
}
