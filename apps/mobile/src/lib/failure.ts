import { userMessage } from "@infinitunes/core/user-message";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { announce } from "./announce";

export type FailureAction = { label: string; onPress: () => void };

export type Failure = { id: number; message: string; action?: FailureAction };

/** How long a failure stays up; one with an action waits longer to be reached. */
export const FAILURE_MS = 4000;
export const FAILURE_WITH_ACTION_MS = 8000;

/**
 * The one failure on screen (`FailureSnackbar`, mounted in the root layout).
 * Failures only: a success never shows here, the UI already changed.
 */
export const failureStore = createStore<{ current: Failure | null }>()(() => ({
  current: null,
}));

let nextId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Shows `message` in place of any failure on screen, and speaks it (VoiceOver). */
export function showFailure(message: string, action?: FailureAction) {
  nextId += 1;
  const id = nextId;
  clearTimeout(timer);
  failureStore.setState({ current: { id, message, action } });
  announce(message);
  timer = setTimeout(
    () => dismissFailure(id),
    action ? FAILURE_WITH_ACTION_MS : FAILURE_MS,
  );
}

/** Hides failure `id`; a newer one that replaced it stays. */
export function dismissFailure(id: number) {
  if (failureStore.getState().current?.id !== id) return;
  clearTimeout(timer);
  failureStore.setState({ current: null });
}

/**
 * A rejection handler that shows the server's message when it is written for
 * the listener (`userMessage`: a refusal such as the playlist cap), else
 * `fallback`.
 */
export function reportFailure(fallback: string) {
  return (error: unknown) => showFailure(userMessage(error, fallback));
}

export function useFailure() {
  return useStore(failureStore, (state) => state.current);
}
