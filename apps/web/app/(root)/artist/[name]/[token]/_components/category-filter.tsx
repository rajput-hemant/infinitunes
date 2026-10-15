"use client";

import type { Category } from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import Link from "next/link";

import { SearchParamsBoundary } from "~/components/search-params-boundary";
import { pendingOnClick, usePendingParams } from "~/lib/pending-params";
import { asRoute, cn } from "~/lib/utils";

const CategoryMap: Record<Category, string> = {
  popularity: "Popular",
  latest: "Date",
  alphabetical: "Name",
};

function isCategory(value: string | null | undefined): value is Category {
  return (
    value === "popularity" || value === "latest" || value === "alphabetical"
  );
}

function CategoryChips({ category: current }: { category: Category }) {
  // The clicked chip is selected now; the URL catches up when the route commits.
  const requested = usePendingParams().get("cat");
  const category = isCategory(requested) ? requested : current;

  return (
    <div className="my-6 flex space-x-2">
      {Object.entries(CategoryMap).map(([key, value]) => (
        <Link
          key={key}
          title={value}
          href={asRoute(`?cat=${key}`)}
          aria-current={category === key ? "true" : undefined}
          onClick={pendingOnClick("cat", key)}
        >
          <Badge
            className={cn(
              "bg-primary-foreground p-2 text-primary hover:bg-muted hover:shadow-xs lg:px-4",
              category === key && "bg-primary! text-primary-foreground",
            )}
          >
            {value}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

/**
 * The sort chips. The selection comes from `?cat=`, so it is filled in by
 * `SearchParamsBoundary` and flips the moment the query string changes.
 */
export function CategoryFilter() {
  return (
    <SearchParamsBoundary
      render={(params) => {
        const cat = params?.get("cat");
        return (
          <CategoryChips category={isCategory(cat) ? cat : "popularity"} />
        );
      }}
    />
  );
}
