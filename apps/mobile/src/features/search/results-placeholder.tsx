import { CatalogGridSkeleton } from "~/components/catalog-grid-skeleton";
import { ErrorState } from "~/components/error-state";
import { SongListSkeleton } from "~/components/skeletons";

import { NoResults } from "./no-results";
import type { TypeResultsStatus } from "./use-type-results";

type ResultsPlaceholderProps = {
  query: string;
  /** Anything but `ready`: what a list shows in place of rows. */
  status: Exclude<TypeResultsStatus, "ready">;
  error: unknown;
  onRetry: () => void;
  /** Songs load as rows, every other type as cards (`round` ones for artists). */
  skeleton: "rows" | "cards" | "round";
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
        <CatalogGridSkeleton round={skeleton === "round"} />
      );
    case "error":
      return <ErrorState error={error} onRetry={onRetry} />;
    case "empty":
      return <NoResults query={query} />;
  }
}
