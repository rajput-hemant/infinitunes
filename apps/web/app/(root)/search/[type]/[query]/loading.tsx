import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { searchUi } from "~/components/search/search-ui";

import { navItems } from "./_components/search-navbar";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="mt-2 h-8 w-full max-w-md md:h-10" />

      <div className={searchUi.chipsRow}>
        {navItems.map(({ type }) => (
          <Skeleton key={type} className="h-(--ctl) w-20 rounded-(--r-ctl)" />
        ))}
      </div>

      <div className={searchUi.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
