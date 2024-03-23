import LanguageBar from "../language-bar";
import { Skeleton } from "../ui/skeleton";
import { SliderCardSkeleton } from "./slider-card-skeleton";

export function TopAlbumsPageSkeleton() {
  return (
    <div className="space-y-4">
      <LanguageBar language="hindi" />

      <Skeleton className="h-8 w-72 sm:h-9 md:h-10" />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
