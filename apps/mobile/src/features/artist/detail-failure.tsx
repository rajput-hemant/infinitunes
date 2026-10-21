import type { SymbolViewProps } from "expo-symbols";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";

import { isNotFound } from "./detail-query";

type DetailFailureProps = {
  /** What was looked up, for the not-found title ("Artist"). */
  noun: string;
  icon: SymbolViewProps["name"];
  error: unknown;
  onRetry: () => void;
};

/** A detail query's failure: a missing entity is final, anything else can be retried. */
export function DetailFailure({
  noun,
  icon,
  error,
  onRetry,
}: DetailFailureProps) {
  if (isNotFound(error)) {
    return (
      <EmptyState
        icon={icon}
        title={`${noun} not found`}
        message="It may have been removed."
      />
    );
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}
