import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "~/components/ui/icon";
import { commit as commitHaptic } from "~/lib/haptics";
import { springs } from "~/theme/motion";
import { sizes, space, swipeFills, swipeGlyph } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

export type SwipeAction = {
  /** Spoken (and the menu's twin): the capsule shows only the glyph. */
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  /** Capsule fill under a white glyph. */
  tone: keyof typeof swipeFills;
  /** The row goes away: it slides out and collapses before `onPress` runs. */
  removes?: boolean;
};

/** The edge a set of actions sits on: `leading` opens on a left-to-right swipe. */
export type SwipeSide = "leading" | "trailing";

/** A swipe past this share of the row's width commits the action (iOS Mail). */
export const FULL_SWIPE_SHARE = 0.6;
/** A fling faster than this (px/s), past `FLING_MIN_DISTANCE`, commits too. */
export const FLING_VELOCITY = 900;
export const FLING_MIN_DISTANCE = 40;

/**
 * The commit rule, shared by every swipeable row (and the queue's): a slow swipe
 * that stops reveals the buttons; a fling toward `side`, or a drag past
 * `FULL_SWIPE_SHARE` of the row, commits at once. `translation` and `velocity` are
 * the gesture's signed x (rightward positive).
 */
export function shouldCommitSwipe({
  translation,
  velocity,
  width,
  side,
}: {
  translation: number;
  velocity: number;
  width: number;
  side: SwipeSide;
}): boolean {
  "worklet";
  const dir = side === "leading" ? 1 : -1;
  const distance = dir * translation;
  return (
    width > 0 &&
    (distance > width * FULL_SWIPE_SHARE ||
      (dir * velocity > FLING_VELOCITY && distance > FLING_MIN_DISTANCE))
  );
}

/** Capsule geometry (Apple Music's): a button rests 64 wide, the row's height less its inset. */
const BUTTON = sizes.touch + space.lg;
const GAP = space.sm;
const INSET = space.xs;
/** A release counts as past the commit point if it was, this long (ms) before JS heard of it. */
const LATCH_MS = 250;
const EXIT_MS = 220;

/** Width of the revealed pane with `count` buttons at rest. */
export function openWidth(count: number): number {
  "worklet";
  return GAP + count * (BUTTON + GAP);
}

/** Whether the drag is at the commit point, and when it last left it (0 while it is there). */
export type CommitLatch = { past: boolean; end: number };

/** Whether a release now commits: past the point, or only just left it (the release spring). */
export function releaseCommits(latch: CommitLatch, now: number): boolean {
  return latch.past || (latch.end > 0 && now - latch.end < LATCH_MS);
}

// A helper, not an inline write: the react lint rejects mutating a shared value in render.
function setWidth(width: SharedValue<number>, next: number) {
  width.value = next;
}

/** px/s since the previous frame. shortcut: the swipeable exposes no gesture velocity; fine at 60fps. */
function sampleVelocity(
  last: SharedValue<{ x: number; t: number }>,
  x: number,
): number {
  "worklet";
  const t = performance.now();
  const dt = t - last.value.t;
  const velocity = dt > 0 && dt < 100 ? ((x - last.value.x) / dt) * 1000 : 0;
  last.value = { x, t };
  return velocity;
}

/**
 * Where a button sits and how wide it is, from the pane's revealed width `reveal`
 * and `stretch` (0 at rest, 1 past the commit point). The buttons share the pane
 * in equal parts, their edges moving with the row (sticky); distances are from
 * the screen edge the pane opens from. Index 0 is the primary (next to the row):
 * once stretched it takes the whole pane while the others fade. `fade` is
 * `stretch` unless reduced motion keeps the fade without the growth.
 */
export function capsuleLayout(
  reveal: number,
  stretch: number,
  index: number,
  count: number,
  fade: number = stretch,
): { edge: number; width: number; opacity: number } {
  "worklet";
  const share = Math.max(0, (reveal - (count + 1) * GAP) / count);
  const edge = GAP + (count - 1 - index) * (share + GAP);
  if (index > 0) return { edge, width: share, opacity: 1 - fade };
  const full = Math.max(0, reveal - 2 * GAP);
  return {
    edge: edge + (GAP - edge) * stretch,
    width: share + (full - share) * stretch,
    opacity: 1,
  };
}

function Capsule({
  action,
  index,
  count,
  side,
  reveal,
  stretch,
  fade,
  onRun,
}: {
  action: SwipeAction;
  index: number;
  count: number;
  side: SwipeSide;
  reveal: SharedValue<number>;
  stretch?: SharedValue<number>;
  fade?: SharedValue<number>;
  onRun: (action: SwipeAction) => void;
}) {
  const style = useAnimatedStyle(() => {
    const { edge, width, opacity } = capsuleLayout(
      reveal.value,
      stretch?.value ?? 0,
      index,
      count,
      fade?.value ?? 0,
    );
    return side === "leading"
      ? { left: edge, width, opacity }
      : { right: edge, width, opacity };
  });
  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          top: INSET,
          bottom: INSET,
          borderRadius: sizes.row,
          backgroundColor: swipeFills[action.tone],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={() => {
          onRun(action);
        }}
        style={StyleSheet.absoluteFill}
        className="items-center justify-center"
      >
        <Icon name={action.icon} size="md" color={swipeGlyph} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * The pane behind a swipe: capsule buttons clipped to the revealed width. The
 * natural-width spacer is what the swipeable measures as the open position; at
 * rest the pane is invisible, because the row is transparent.
 */
function ActionPane({
  side,
  actions,
  translation,
  rowWidth,
  moved,
  latch,
  onRun,
  onCommitChange,
}: {
  side: SwipeSide;
  actions: readonly SwipeAction[];
  translation: SharedValue<number>;
  rowWidth: SharedValue<number>;
  moved: SharedValue<number>;
  latch: SharedValue<CommitLatch>;
  onRun: (action: SwipeAction) => void;
  onCommitChange: (past: boolean) => void;
}) {
  const dragged = translation;
  const sign = side === "leading" ? 1 : -1;
  const reveal = useDerivedValue(() => Math.max(0, sign * dragged.value));
  const content = { side, actions, reveal, moved, onRun };
  return Platform.OS === "ios" ? (
    <CommitPane
      {...content}
      dragged={dragged}
      rowWidth={rowWidth}
      latch={latch}
      onCommitChange={onCommitChange}
    />
  ) : (
    <PaneContent {...content} />
  );
}

type PaneContentProps = {
  side: SwipeSide;
  actions: readonly SwipeAction[];
  reveal: SharedValue<number>;
  moved: SharedValue<number>;
  stretch?: SharedValue<number>;
  fade?: SharedValue<number>;
  onRun: (action: SwipeAction) => void;
};

/** Only iOS stretches and commits; Android needs none of its animation state. */
function CommitPane({
  dragged,
  rowWidth,
  latch,
  onCommitChange,
  ...content
}: PaneContentProps & {
  dragged: SharedValue<number>;
  rowWidth: SharedValue<number>;
  latch: SharedValue<CommitLatch>;
  onCommitChange: (past: boolean) => void;
}) {
  const { side } = content;
  const stretch = useSharedValue(0);
  const fade = useSharedValue(0);
  const last = useSharedValue({ x: 0, t: 0 });
  const reduced = useReducedMotion();

  useAnimatedReaction(
    () =>
      shouldCommitSwipe({
        translation: dragged.value,
        velocity: sampleVelocity(last, dragged.value),
        width: rowWidth.value,
        side,
      }),
    (past, previous) => {
      const target = past ? 1 : 0;
      // Reduced motion keeps the fade, not the growth.
      stretch.set(reduced ? 0 : withSpring(target, springs.spatialDefault));
      fade.set(withTiming(target, { duration: 150 }));
      if (previous !== null && past !== previous) {
        // The release spring drops the row back below the commit point within a
        // frame or two, before JS hears of the release: remember it.
        latch.set({ past, end: past ? 0 : Date.now() });
        // Crossing the commit point ticks, in either direction.
        scheduleOnRN(onCommitChange, past);
      }
    },
  );
  return <PaneContent {...content} stretch={stretch} fade={fade} />;
}

function PaneContent({
  side,
  actions,
  reveal,
  moved,
  stretch,
  fade,
  onRun,
}: PaneContentProps) {
  useAnimatedReaction(
    () => reveal.value,
    (value) => {
      moved.set(value);
    },
  );

  const paneStyle = useAnimatedStyle(() => ({
    width: reveal.value,
    opacity: reveal.value > 0 ? 1 : 0,
  }));

  return (
    <>
      <View style={{ width: openWidth(actions.length) }} />
      <Animated.View
        pointerEvents="box-none"
        style={[
          paneStyle,
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            overflow: "hidden",
          },
          side === "leading" ? { left: 0 } : { right: 0 },
        ]}
      >
        {/* Primary last, so its stretch covers the others. */}
        {actions
          .map((action, index) => (
            <Capsule
              key={action.label}
              action={action}
              index={index}
              count={actions.length}
              side={side}
              reveal={reveal}
              stretch={stretch}
              fade={fade}
              onRun={onRun}
            />
          ))
          .reverse()}
      </Animated.View>
    </>
  );
}

/** The row while displaced: a translucent capsule behind its content. */
function RowCapsule({ moved }: { moved: SharedValue<number> }) {
  const fill = useTokenColor("fill-3");
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, moved.value / GAP),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        StyleSheet.absoluteFill,
        {
          top: INSET,
          bottom: INSET,
          borderRadius: sizes.row,
          backgroundColor: fill,
        },
      ]}
    />
  );
}

/**
 * A row with Apple Music's swipe actions: `leading` (left to right) and/or
 * `trailing` (right to left) sets of icon capsules. Each set lists its primary
 * action first: it sits next to the row and is the one a full swipe stretches
 * into and runs; the rest sit further out, and the capsules share the revealed
 * width. The swipe is a shortcut: every action also lives in the row's menu and
 * as a screen reader action. A slow swipe that stops reveals the buttons (tap
 * one to run it); on iOS a fling or a swipe past `FULL_SWIPE_SHARE` runs the
 * primary on release (`shouldCommitSwipe`). An action with `removes` slides the
 * row out and collapses its height first. The row is transparent at rest, so it
 * keeps whatever surface it is on.
 */
export function SwipeableRow({
  leading,
  trailing,
  enabled = true,
  children,
}: {
  leading?: readonly SwipeAction[];
  trailing?: readonly SwipeAction[];
  enabled?: boolean;
  children: ReactNode;
}) {
  const swipeable = useRef<SwipeableMethods>(null);
  // iOS only: Android keeps the revealed buttons.
  const fullSwipe = Platform.OS === "ios";
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const moved = useSharedValue(0);
  const exit = useSharedValue(0);
  const latch = useSharedValue<CommitLatch>({ past: false, end: 0 });
  const reduced = useReducedMotion();
  const exiting = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = (action: SwipeAction) => {
    if (!action.removes) {
      swipeable.current?.close();
      action.onPress();
      return;
    }
    if (exiting.current) return;
    exiting.current = true;
    const done = () => {
      action.onPress();
      // The row normally unmounts with its data; if the write is refused it returns.
      timer.current = setTimeout(() => {
        exiting.current = false;
        exit.set(0);
        swipeable.current?.close();
      }, 600);
    };
    if (reduced) {
      done();
      return;
    }
    exit.set(
      withTiming(
        1,
        { duration: EXIT_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(done);
        },
      ),
    );
  };

  const wrapStyle = useAnimatedStyle(() =>
    exit.value > 0
      ? {
          height: height.value * (1 - exit.value),
          opacity: 1 - exit.value,
          overflow: "hidden",
        }
      : {},
  );

  const pane = (
    side: SwipeSide,
    set: readonly SwipeAction[],
    translation: SharedValue<number>,
  ) => (
    <ActionPane
      side={side}
      actions={set}
      translation={translation}
      rowWidth={width}
      moved={moved}
      latch={latch}
      onRun={run}
      onCommitChange={commitHaptic}
    />
  );

  const release = (direction: string) => {
    // Released past the commit point: run the primary instead of resting open.
    if (!fullSwipe || !releaseCommits(latch.get(), Date.now())) return;
    latch.set({ past: false, end: 0 });
    const primary = (direction === "left" ? leading : trailing)?.[0];
    if (primary) run(primary);
  };

  return (
    <Animated.View style={wrapStyle}>
      <ReanimatedSwipeable
        ref={swipeable}
        enabled={enabled}
        overshootLeft={fullSwipe && !!leading?.length}
        overshootRight={fullSwipe && !!trailing?.length}
        onSwipeableWillOpen={release}
        renderLeftActions={
          leading?.length
            ? (_progress, translation) => pane("leading", leading, translation)
            : undefined
        }
        renderRightActions={
          trailing?.length
            ? (_progress, translation) =>
                pane("trailing", trailing, translation)
            : undefined
        }
      >
        <View
          onLayout={(event) => {
            setWidth(width, event.nativeEvent.layout.width);
            height.set(event.nativeEvent.layout.height);
          }}
        >
          <RowCapsule moved={moved} />
          {children}
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}
