import type { ComponentProps, ReactElement } from "react";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";

import type { LibraryList } from "./library-list";

type ReadyList<Item> = Extract<LibraryList<Item>, { status: "ready" }>;

type LibraryListViewProps<Item> = {
  list: LibraryList<Item>;
  /** Layout-matching placeholder for the first load. */
  skeleton: ReactElement;
  /** Shown when the list loaded and has nothing in it. */
  empty: ComponentProps<typeof EmptyState>;
  children: (ready: ReadyList<Item>) => ReactElement;
};

/** The loading, error and empty states every library list shares. */
export function LibraryListView<Item>({
  list,
  skeleton,
  empty,
  children,
}: LibraryListViewProps<Item>) {
  switch (list.status) {
    case "loading":
      return skeleton;
    case "error":
      return <ErrorState error={list.error} onRetry={list.retry} />;
    case "ready":
      return list.items.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        children(list)
      );
  }
}
