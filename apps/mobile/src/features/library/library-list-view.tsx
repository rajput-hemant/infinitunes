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
      if (list.items.length > 0) return children(list);
      return list.missing > 0 ? (
        <UnavailableState
          icon={empty.icon}
          missing={list.missing}
          retry={list.refresh}
        />
      ) : (
        <EmptyState {...empty} />
      );
  }
}

/** Everything saved here is gone upstream: say so, instead of "nothing yet". */
function UnavailableState({
  icon,
  missing,
  retry,
}: {
  icon: ComponentProps<typeof EmptyState>["icon"];
  missing: number;
  retry: () => void;
}) {
  return (
    <EmptyState
      icon={icon}
      title={
        missing === 1
          ? "This item is no longer available"
          : `These ${missing} items are no longer available`
      }
      message="The music service couldn't find what you saved here. It may have been removed."
      action={{ label: "Try again", onPress: retry }}
    />
  );
}
