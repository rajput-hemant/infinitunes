import { useEffect } from "react";
import { Platform } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  playerStore,
  selectHasNext,
  selectHasPrevious,
  usePlayer,
} from "~/playback/player-store";
import { springs } from "~/theme/motion";
import { space } from "~/theme/tokens";

import { playerHaptics } from "./haptics";

/** Points per second (the gesture handler's unit): a flick this fast counts. */
const FLICK_VELOCITY = 800;
/** Share of the screen a slow drag down must cover to close the player. */
const DISMISS_SHARE = 0.2;
/** Share of the width a slow sideways drag must cover to change the song. */
const SWIPE_SHARE = 0.3;
/** How long the art takes to leave after a swipe that changed the song. */
const LEAVE_MS = 160;
/**
 * The swipe's own springs run under reduce motion too: there the swiped
 * element only fades (`useSwipeStyle`), and the fade is feedback, not movement.
 */
const SETTLE = { ...springs.spatialDefault, reduceMotion: ReduceMotion.Never };

/** Whether a drag down by `translation` at `velocity` closes the player. */
export function shouldDismiss(
  translation: number,
  velocity: number,
  height: number,
): boolean {
  "worklet";
  if (translation <= 0) return false;
  return translation > height * DISMISS_SHARE || velocity > FLICK_VELOCITY;
}

/** Which ways the queue can move from the current entry. */
export type SwipeEdges = { next: boolean; previous: boolean };

/** How far a drag towards a song that does not exist follows the finger. */
const EDGE_RESISTANCE = 0.25;

/** The way a drag of `translation` points: left is next, right previous. */
function directionOf(translation: number) {
  "worklet";
  return translation < 0 ? "next" : "previous";
}

/**
 * What a sideways drag does: left is the next song, right the previous, as
 * Apple Music and Spotify; short and slow drags (or a flick back against the
 * drag) spring back, as does a drag past the queue's end (`edges`).
 */
export function swipeDecision(
  translation: number,
  velocity: number,
  width: number,
  edges: SwipeEdges = { next: true, previous: true },
): "next" | "previous" | null {
  "worklet";
  if (translation === 0) return null;
  const far = Math.abs(translation) > width * SWIPE_SHARE;
  const flick =
    Math.abs(velocity) > FLICK_VELOCITY &&
    Math.sign(velocity) === Math.sign(translation);
  const against =
    Math.abs(velocity) > FLICK_VELOCITY &&
    Math.sign(velocity) !== Math.sign(translation);
  if (against || (!far && !flick)) return null;
  const direction = directionOf(translation);
  return edges[direction] ? direction : null;
}

/**
 * Next or previous through the store, so radio refill, repeat and shuffle
 * apply. Nothing (no tap either) past the queue's end.
 */
export function changeSong(direction: "next" | "previous") {
  const state = playerStore.getState();
  const can =
    direction === "next" ? selectHasNext(state) : selectHasPrevious(state);
  if (!can) return;
  playerHaptics.press();
  if (direction === "next") state.skipToNext();
  else state.skipToPrevious();
}

/** The queue's edges as a shared value the swipe's worklets read. */
function useSwipeEdges() {
  const next = usePlayer(selectHasNext);
  const previous = usePlayer(selectHasPrevious);
  const edges = useSharedValue<SwipeEdges>({ next, previous });
  useEffect(() => {
    edges.set({ next, previous });
  }, [edges, next, previous]);
  return edges;
}

/** Screen reader actions for an element that also takes the song swipe. */
export const songSwipeActions = {
  accessibilityActions: [
    { name: "nextTrack", label: "Next track" },
    { name: "previousTrack", label: "Previous track" },
  ],
  onAccessibilityAction: ({
    nativeEvent,
  }: {
    nativeEvent: { actionName: string };
  }) => {
    if (nativeEvent.actionName === "nextTrack") changeSong("next");
    if (nativeEvent.actionName === "previousTrack") changeSong("previous");
  },
};

/**
 * Drag down to close: follows the finger into `offset`, then closes past a
 * fifth of the screen or on a flick, else springs back. Sideways movement
 * fails it, so the song swipe and the slider keep theirs.
 */
export function useDismissPan(
  offset: SharedValue<number>,
  height: number,
  onDismiss: () => void,
) {
  return usePanGesture({
    activeOffsetY: space.md,
    failOffsetX: [-space.md, space.md],
    onUpdate: (event) => {
      "worklet";
      offset.set(Math.max(event.translationY, 0));
    },
    onDeactivate: (event) => {
      "worklet";
      if (
        !event.canceled &&
        shouldDismiss(event.translationY, event.velocityY, height)
      ) {
        if (Platform.OS === "ios") {
          // Keep moving on the UI thread while the navigator handles the pop.
          offset.set(withTiming(height, { duration: 180 }));
        }
        scheduleOnRN(onDismiss);
        return;
      }
      offset.set(withSpring(0, springs.spatialDefault));
    },
  });
}

/**
 * Swipe sideways to change the song: the element follows the finger in
 * `offset`, leaves the way it was thrown and the next one springs in from the
 * other side. Vertical movement fails it (scrolling, the drag down to close).
 */
function useSongSwipe(offset: SharedValue<number>, width: number) {
  const reduceMotion = useReducedMotion();
  const edges = useSwipeEdges();
  return usePanGesture({
    activeOffsetX: [-space.md, space.md],
    failOffsetY: [-space.md, space.md],
    onUpdate: (event) => {
      "worklet";
      const x = event.translationX;
      // Towards a song that does not exist it rubber-bands.
      offset.set(edges.get()[directionOf(x)] ? x : x * EDGE_RESISTANCE);
    },
    onDeactivate: (event) => {
      "worklet";
      const decision = event.canceled
        ? null
        : swipeDecision(
            event.translationX,
            event.velocityX,
            width,
            edges.get(),
          );
      if (!decision) {
        offset.set(withSpring(0, SETTLE));
        return;
      }
      const away = decision === "next" ? -width : width;
      offset.set(
        withTiming(
          away,
          { duration: LEAVE_MS, reduceMotion: ReduceMotion.Never },
          (finished) => {
            if (!finished) return;
            scheduleOnRN(changeSong, decision);
            // The next song comes in from the far side (a fade under reduce motion).
            offset.set(reduceMotion ? width / 2 : -away / 2);
            offset.set(withSpring(0, SETTLE));
          },
        ),
      );
    },
  });
}

/** A song swipe for one element: its gesture and the style that follows `offset`. */
export function useSwipeable(offset: SharedValue<number>, width: number) {
  return {
    gesture: useSongSwipe(offset, width),
    style: useSwipeStyle(offset, width),
  };
}

/**
 * The swiped element's style: it moves with `offset` and fades as it goes;
 * under reduce motion it only fades.
 */
function useSwipeStyle(offset: SharedValue<number>, width: number) {
  const reduceMotion = useReducedMotion();
  return useAnimatedStyle(() => {
    const x = offset.get();
    const opacity = 1 - Math.min(Math.abs(x) / Math.max(width, 1), 1) * 0.6;
    return reduceMotion
      ? { opacity }
      : { opacity, transform: [{ translateX: x }] };
  });
}
