import { languages } from "@/config/languages";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { SliderCardSkeleton } from "./slider-card-skeleton";

export function TopAlbumsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border-b py-2">
        <div className="flex space-x-2 py-1 sm:space-x-6 md:space-x-10 lg:space-x-12">
          {languages.map((lang) => (
            <Badge
              key={lang}
              className="bg-primary-foreground p-2 text-primary-foreground lg:px-4"
            >
              {lang}
            </Badge>
          ))}
        </div>
      </div>

      <Skeleton className="h-8 w-72 sm:h-9 md:h-10" />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
