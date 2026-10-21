import { userMessage } from "@infinitunes/core/user-message";

import { EmptyState } from "./empty-state";

type ErrorStateProps = {
  /** The failed query's error; its message shows only when it is safe copy. */
  error: unknown;
  onRetry: () => void;
};

/** A failed load: what went wrong in plain words, and a retry. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={{ ios: "exclamationmark.triangle", android: "error" }}
      title="Couldn't load this"
      message={userMessage(error)}
      action={{ label: "Try again", onPress: onRetry }}
    />
  );
}
