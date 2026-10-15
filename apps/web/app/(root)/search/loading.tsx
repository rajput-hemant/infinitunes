import { Skeleton } from "@infinitunes/ui/components/skeleton";

import {
  SearchFieldSkeleton,
  SearchRowSkeleton,
} from "~/components/search/search-skeleton";
import { searchUi } from "~/components/search/search-ui";
import { cn } from "~/lib/utils";

const ROW_COUNT = 10;

/** Mirrors the search root: title, the search field, then the top-search rows. */
export default function SearchLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <header className="pt-2">
        <Skeleton className="h-8 w-32 md:h-10 md:w-40" />
      </header>

      <SearchFieldSkeleton />

      <section>
        <div
          className={cn("mb-3 flex h-7 items-center", searchUi.sectionTitle)}
        >
          <Skeleton className="h-4 w-36" />
        </div>

        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <SearchRowSkeleton key={i} />
        ))}
      </section>
    </div>
  );
}
