import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

import { shelfItemClassName, shelfListClassName } from "./shelf-layout";
import { SliderCardSkeleton } from "./slider-card-skeleton";
import type { SliderCardSkeletonProps } from "./slider-card-skeleton";

type ShelfSkeletonProps = SliderCardSkeletonProps & {
  rows?: 1 | 2;
  /** Cards per row; the shelf overflows, so a few more than fit is enough. */
  count?: number;
  className?: string;
};

/** A `Shelf` of placeholder cards: same list and item classes, no arrows or scripts. */
export function ShelfSkeleton(props: ShelfSkeletonProps) {
  const { rows = 1, count = 8, className, ...card } = props;

  return (
    <div className={cn("pointer-events-none relative", className)}>
      <ol className={cn(shelfListClassName(rows), "overflow-x-hidden")}>
        {Array.from({ length: count * rows }).map((_, i) => (
          <li key={i} className={shelfItemClassName}>
            <SliderCardSkeleton {...card} />
          </li>
        ))}
      </ol>
    </div>
  );
}

type SliderListSkeletonProps = ShelfSkeletonProps & {
  /** How many titled shelves, e.g. the Suspense fallback of one section is 1. */
  sections?: number;
};

/** Mirrors `SliderList`: a 28px title line, then the shelf, `space-y-3`. */
export function SliderListSkeleton(props: SliderListSkeletonProps) {
  const { sections = 1, ...shelf } = props;

  return Array.from({ length: sections }).map((_, i) => (
    <section key={i} className="space-y-3">
      <SectionTitleSkeleton />

      <ShelfSkeleton {...shelf} />
    </section>
  ));
}

/** The 28px `font-heading text-xl leading-7` section title. */
export function SectionTitleSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-7 w-44 md:w-56", className)} />;
}
