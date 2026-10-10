import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { languages } from "~/config/languages";

const CATEGORY_TILE_COUNT = 8;

export default function BrowseLoading() {
  return (
    <div aria-busy="true">
      <header className="space-y-1 pt-2 pb-6">
        <Skeleton className="h-8 w-32 md:h-10" />

        <div className="flex h-5 items-center">
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
        {Array.from({ length: CATEGORY_TILE_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>

      <section className="mt-8 space-y-3">
        <Skeleton className="h-7 w-28" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
          {languages.map((language) => (
            <Skeleton key={language} className="h-18 rounded-md" />
          ))}
        </div>
      </section>
    </div>
  );
}
