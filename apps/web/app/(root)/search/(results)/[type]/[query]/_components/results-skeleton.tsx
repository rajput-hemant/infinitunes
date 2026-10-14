"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import {
  SearchRowSkeleton,
  TopResultSkeleton,
} from "~/components/search/search-skeleton";
import { searchUi } from "~/components/search/search-ui";
import {
  SectionTitleSkeleton,
  SliderListSkeleton,
} from "~/components/slider/shelf-skeleton";
import { SliderCardSkeleton } from "~/components/slider/slider-card-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";
import { cn } from "~/lib/utils";

import { navItems } from "./search-navbar";

const GRID_CARD_COUNT = 24;

/** The "all" tab: top result beside four songs, then the album, artist, playlist and podcast shelves. */
function AllResultsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
        <section>
          <SectionTitleSkeleton className="mb-3 w-28 md:w-28" />
          <TopResultSkeleton />
        </section>

        <section>
          <SectionTitleSkeleton className="mb-3 w-20 md:w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SearchRowSkeleton key={i} />
          ))}
        </section>
      </div>

      <SliderListSkeleton sections={4} />
    </div>
  );
}

function ResultsOfType({ type }: { type?: string }) {
  if (type === "all") return <AllResultsSkeleton />;
  if (type === "song") return <SongListSkeleton length={12} />;

  return (
    <div className={searchUi.grid}>
      {Array.from({ length: GRID_CARD_COUNT }).map((_, i) => (
        <SliderCardSkeleton key={i} rounded={type === "artist"} />
      ))}
    </div>
  );
}

function ResultsOfRouteType() {
  const { type } = useParams<{ type?: string }>();

  return <ResultsOfType type={type} />;
}

/**
 * The results area for the route's tab. `useParams` is request data while the
 * route prerenders, so the tab-specific shape sits in its own boundary with the
 * grid shape (the most common) as the shell.
 */
export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true">
      <Suspense fallback={<ResultsOfType />}>
        <ResultsOfRouteType />
      </Suspense>
    </div>
  );
}

/** Title line and filter chips, which the layout shows until the route's params are known. */
export function SearchResultsHeaderSkeleton() {
  return (
    <>
      <header className="pt-2">
        <Skeleton className="h-8 w-64 max-w-full md:h-10" />
      </header>

      <nav>
        <div className={searchUi.chipsRow}>
          {navItems.map(({ type: navType, title }) => (
            <Skeleton
              key={navType}
              className={cn(
                "h-(--ctl) shrink-0 rounded-(--r-ctl)",
                title.length > 6 ? "w-24" : "w-16",
              )}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
