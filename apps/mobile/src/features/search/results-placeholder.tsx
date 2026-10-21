import { ErrorState } from "~/components/error-state";
import { ShelfSkeleton, SongListSkeleton } from "~/components/skeletons";

import { NoResults } from "./no-results";
import type { TypeResultsStatus } from "./use-type-results";

type ResultsPlaceholderProps = {
  query: string;
  /** Anything but `ready`: what a list shows in place of rows. */
  status: Exclude<TypeResultsStatus, "ready">;
  error: unknown;
  onRetry: () => void;
  /** Songs load as rows, every other type as cards. */
  skeleton: "rows" | "cards";
};

/** The loading, empty and error states of a type's result list. */
export function ResultsPlaceholder({
  query,
  status,
  error,
  onRetry,
  skeleton,
}: ResultsPlaceholderProps) {
  switch (status) {
    case "loading":
      return skeleton === "rows" ? (
        <SongListSkeleton rows={6} />
      ) : (
        <>
          <ShelfSkeleton />
          <ShelfSkeleton />
        </>
      );
    case "error":
      return <ErrorState error={error} onRetry={onRetry} />;
    case "empty":
      return <NoResults query={query} />;
  }
}
