import type { CardItem } from "@infinitunes/types";
import type { UseQueryResult } from "@tanstack/react-query";

import { Shelf } from "~/components/shelf";
import { ShelfSkeleton } from "~/components/skeletons";

type SecondaryShelfProps = {
  title: string;
  query: UseQueryResult<CardItem[], unknown>;
};

/**
 * A recommendations-style shelf. It is secondary: a failed or empty list
 * leaves out the shelf instead of failing the page.
 */
export function SecondaryShelf({ title, query }: SecondaryShelfProps) {
  if (query.isPending) return <ShelfSkeleton />;
  return <Shelf title={title} items={query.data ?? []} />;
}
