import Link from "next/link";

import type { Category } from "@/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  category: Category;
};

const CategoryMap = {
  popularity: "Popular",
  latest: "Date",
  alphabetical: "Name",
};

export function CategoryFilter({ category }: CategoryFilterProps) {
  return (
    <div className="my-6 flex space-x-2">
      {Object.entries(CategoryMap).map(([key, value]) => (
        <Link key={key} title={value} href={`?cat=${key}`}>
          <Badge
            className={cn(
              "bg-primary-foreground p-2 text-primary hover:bg-muted hover:shadow-sm lg:px-4",
              category === key && "!bg-primary text-primary-foreground"
            )}
          >
            {value}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
