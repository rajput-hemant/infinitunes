import Link from "next/link";

import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  path: string;
  category: Category;
};

const categoryMap = {
  popularity: "Popular",
  latest: "Date",
  alphabetical: "Name",
};

const CategoryFilter = ({ path, category }: Props) => {
  return (
    <div className="my-6 flex space-x-2">
      {Object.entries(categoryMap).map(([key, value]) => (
        <Link key={key} title={value} href={`${path}?cat=${key}`}>
          <Badge
            className={cn(
              "bg-primary-foreground p-2 text-primary hover:bg-muted lg:px-4",
              category === key && "!bg-primary text-primary-foreground"
            )}
          >
            {value}
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export default CategoryFilter;
