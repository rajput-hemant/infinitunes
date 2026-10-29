import { getErrorCode } from "@infinitunes/core/error-code";
import { userMessage } from "@infinitunes/core/user-message";
import { AccessibilityInfo } from "react-native";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { announce } from "./announce";
import { reject } from "./haptics";

export type FailureAction = { label: string; onPress: () => void };

export type Failure = { id: number; message: string; action?: FailureAction };

/** How long a failure stays up; one with an action waits longer to be reached. */
export const FAILURE_MS = 4000;
export const FAILURE_WITH_ACTION_MS = 8000;
/** A screen reader needs longer to reach the message and its action. */
const SCREEN_READER_FACTOR = 3;

let screenReader = false;
void AccessibilityInfo.isScreenReaderEnabled?.()
  .then((on) => (screenReader = on))
  .catch(() => {});
AccessibilityInfo.addEventListener?.("screenReaderChanged", (on) => {
  screenReader = on;
});

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
  reject();
  startTimer(id, Boolean(action));
}

function startTimer(id: number, withAction: boolean) {
  clearTimeout(timer);
  timer = setTimeout(
    () => dismissFailure(id),
    (withAction ? FAILURE_WITH_ACTION_MS : FAILURE_MS) *
      (screenReader ? SCREEN_READER_FACTOR : 1),
  );
}

/** Stops failure `id` from leaving while the listener is dragging it. */
export function holdFailure(id: number) {
  if (failureStore.getState().current?.id === id) clearTimeout(timer);
}

/** Starts failure `id`'s countdown over, once the drag let go of it. */
export function releaseFailure(id: number) {
  const failure = failureStore.getState().current;
  if (failure?.id === id) startTimer(id, Boolean(failure.action));
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
 * `fallback`. An error without a tRPC code (the network, a thrown bug) never
 * shows its own message.
 */
export function reportFailure(fallback: string) {
  return (error: unknown) =>
    showFailure(
      getErrorCode(error) === undefined
        ? fallback
        : userMessage(error, fallback),
    );
}

export function useFailure() {
  return useStore(failureStore, (state) => state.current);
}
