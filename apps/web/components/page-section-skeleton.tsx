import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

/**
 * The `font-heading text-xl sm:text-2xl md:text-3xl` page section title of the
 * detail pages (28px, 32px from sm, 36px from md), inset 8px until lg.
 */
export function PageSectionTitleSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("ml-2 h-7 w-52 sm:h-8 md:h-9 md:w-72 lg:ml-0", className)}
    />
  );
}

type TextLinesSkeletonProps = {
  lines?: number;
  className?: string;
};

/** Body copy at the base `text-sm` size: 20px lines, the last one short. */
export function TextLinesSkeleton({
  lines = 3,
  className,
}: TextLinesSkeletonProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex h-5 items-center">
          <Skeleton
            className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        </div>
      ))}
    </div>
  );
}
