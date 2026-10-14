import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { searchUi } from "./search-ui";

/** Mirrors `SearchRow`: 48px row, 40px art, a 20px title line over a 16px subtitle line. */
export function SearchRowSkeleton({ round }: { round?: boolean }) {
  return (
    <div className={searchUi.rowLayout}>
      <Skeleton
        className={cn(searchUi.art, "bg-muted", round && searchUi.artRound)}
      />

      <span className="min-w-0 flex-1">
        <span className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-48 max-w-full" />
        </span>
        <span className="flex h-4 items-center">
          <Skeleton className="h-2.5 w-24" />
        </span>
      </span>
    </div>
  );
}

/** Mirrors `SearchField` in its page variant. */
export function SearchFieldSkeleton() {
  return <Skeleton className={cn(searchUi.fieldPage, "bg-muted")} />;
}

/** Mirrors `TopResultCard`: the panel, a 96px cover, a title and subtitle, the Play button. */
export function TopResultSkeleton() {
  return (
    <div className={cn(searchUi.panel, "grid gap-3")}>
      <Skeleton className="size-24" />

      <div>
        <div className="flex h-7 items-center">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>

      <div>
        <Skeleton className={cn(controlStyles.hero, "w-24")} />
      </div>
    </div>
  );
}
