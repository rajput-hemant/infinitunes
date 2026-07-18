"use client";

import { usePathname } from "next/navigation";

import { SliderListSkeleton, SongListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { navItems } from "./_components/search-navbar";

export default function Loading() {
  const [type] = usePathname().split("/").slice(-2);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />
        <Skeleton className="h-4 w-32" />
      </div>

      <main className="space-y-4 border-t">
        <div className="border-b">
          <div className="hidden h-full items-center gap-2 lg:flex">
            {navItems.map(({ title }) => {
              return (
                <div
                  key={title}
                  className="inline-block h-full border-b-2 border-transparent py-2 hover:border-primary"
                >
                  <Button variant="secondary" className="text-secondary">
                    {title}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {type === "song" ?
          <SongListSkeleton length={20} />
        : <SliderListSkeleton length={40} />}
      </main>
    </div>
  );
}
