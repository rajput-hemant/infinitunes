"use client";

import { CatalogEnd } from "~/components/catalog/catalog-states";
import { NextPageSkeleton } from "~/components/catalog/next-page-skeleton";
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
    <>
      <NextPageSkeleton loading={isFetchingNextPage} />
      {/* Persistent, so screen readers hear the text when it appears. */}
      <output ref={ref} className="block py-6">
        {isFetchingNextPage && <span className="sr-only">Loading...</span>}
      </output>
    </>
  );
}
