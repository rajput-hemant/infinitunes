import { Skeleton } from "@infinitunes/ui/components/skeleton";

import {
  PageSectionTitleSkeleton,
  TextLinesSkeleton,
} from "~/components/page-section-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

const TAB_WIDTHS = ["w-20", "w-12", "w-14", "w-20"] as const;

/** Mirrors `ArtistTabNav`: a line tab row, 40px tall (44px coarse), with a hairline below. */
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

/** The Overview panel: a section title over the top ten songs. */
export function ArtistOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageSectionTitleSkeleton />
      <SongListSkeleton length={10} />
    </div>
  );
}

/** The Biography panel: a card of text sections. */
export function ArtistBioSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-8 rounded-md bg-card p-6 ring-1 ring-inset ring-border">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <TextLinesSkeleton lines={4} />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <TextLinesSkeleton lines={3} />
      </div>
    </div>
  );
}
