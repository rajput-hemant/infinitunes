"use client";

import { Loader2 } from "lucide-react";

import { CatalogEnd } from "~/app/(root)/browse/_components/catalog-states";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";

type CatalogLoadMoreProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

/** Requests the next page when its placeholder scrolls into view, then shows the end marker. */
export function CatalogLoadMore(props: CatalogLoadMoreProps) {
  const { hasNextPage, isFetchingNextPage, onLoadMore } = props;

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        onLoadMore();
      }
    },
  });

  if (!hasNextPage) {
    return <CatalogEnd />;
  }

  return (
    <div
      ref={ref}
      className="flex items-center justify-center gap-2 py-6 text-sm font-medium text-muted-foreground"
    >
      {isFetchingNextPage && (
        <>
          <Loader2 className="size-5 animate-spin" /> Loading...
        </>
      )}
    </div>
  );
}
