"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { usePathname } from "next/navigation";

import { searchUi } from "~/components/search/search-ui";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

import { navItems } from "./_components/search-navbar";

export default function Loading() {
  const [type] = usePathname().split("/").slice(-2);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="space-y-6">
        <div className={searchUi.chipsRow}>
          {navItems.map(({ title }) => (
            <Skeleton key={title} className="h-(--ctl) w-20 rounded-(--r-ctl)" />
          ))}
        </div>

        {type === "song" ? (
          <SongListSkeleton length={20} />
        ) : (
          <SliderListSkeleton length={40} />
        )}
      </div>
    </div>
  );
}
