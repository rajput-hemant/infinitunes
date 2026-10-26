import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
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

/** Capsule geometry (Apple Music's): a button is 64 wide, the row's height less its inset. */
const BUTTON = sizes.touch + space.lg;
const GAP = space.sm;
const INSET = space.xs;

/** Width of the revealed pane with `count` buttons at rest. */
export function openWidth(count: number): number {
  "worklet";
  return GAP + count * (BUTTON + GAP);
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
 * and `stretch` (0 at rest, 1 past the commit point). Distances are from the
 * screen edge the pane opens from. Index 0 is the primary (next to the row): it
 * takes any overshoot, then the whole pane once stretched; the others stay put
 * and fade.
 */
export function capsuleLayout(
  reveal: number,
  stretch: number,
  index: number,
  count: number,
): { edge: number; width: number; opacity: number } {
  "worklet";
  const open = openWidth(count);
  if (index > 0) {
    return {
      edge: GAP + (count - 1 - index) * (BUTTON + GAP),
      width: BUTTON,
      opacity: 1 - stretch,
    };
  }
  const grown = BUTTON + Math.max(0, reveal - open);
  const width = grown + (reveal - 2 * GAP - grown) * stretch;
  return { edge: Math.max(reveal, open) - GAP - width, width, opacity: 1 };
}

function Capsule({
  action,
  index,
  count,
  side,
  reveal,
  stretch,
  onRun,
}: {
  action: SwipeAction;
  index: number;
  count: number;
  side: SwipeSide;
  reveal: SharedValue<number>;
  stretch: SharedValue<number>;
  onRun: (action: SwipeAction) => void;
}) {
  const style = useAnimatedStyle(() => {
    const { edge, width, opacity } = capsuleLayout(
      reveal.value,
      stretch.value,
      index,
      count,
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
  onRun,
  onCommitChange,
}: {
  side: SwipeSide;
  actions: readonly SwipeAction[];
  translation: SharedValue<number> | undefined;
  rowWidth: SharedValue<number>;
  moved: SharedValue<number>;
  onRun: (action: SwipeAction) => void;
  onCommitChange: (past: boolean) => void;
}) {
  const fallback = useSharedValue(0);
  const dragged = translation ?? fallback;
  const sign = side === "leading" ? 1 : -1;
  const reveal = useDerivedValue(() => Math.max(0, sign * dragged.value));
  const stretch = useSharedValue(0);
  const last = useSharedValue({ x: 0, t: 0 });
  // Android keeps the revealed buttons: no commit point.
  const commits = Platform.OS === "ios";

  useAnimatedReaction(
    () =>
      commits &&
      shouldCommitSwipe({
        translation: dragged.value,
        velocity: sampleVelocity(last, dragged.value),
        width: rowWidth.value,
        side,
      }),
    (past, previous) => {
      stretch.set(withSpring(past ? 1 : 0, springs.spatialDefault));
      // Crossing the commit point ticks, in either direction.
      if (previous !== null && past !== previous) {
        scheduleOnRN(onCommitChange, past);
      }
    },
  );
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
        {actions.map((action, index) => (
          <Capsule
            key={action.label}
            action={action}
            index={index}
            count={actions.length}
            side={side}
            reveal={reveal}
            stretch={stretch}
            onRun={onRun}
          />
        ))}
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
 * into and runs; the rest sit further out. The swipe is a shortcut: every action
 * also lives in the row's menu and as a screen reader action. A slow swipe that
 * stops reveals the buttons (tap one to run it); on iOS a fling or a swipe past
 * `FULL_SWIPE_SHARE` runs the primary on release (`shouldCommitSwipe`). The row is
 * transparent at rest, so it keeps whatever surface it is on.
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
  const moved = useSharedValue(0);
  const past = useRef(false);
  const run = (action: SwipeAction) => {
    swipeable.current?.close();
    action.onPress();
  };

  const pane = (
    side: SwipeSide,
    set: readonly SwipeAction[],
    translation: SharedValue<number> | undefined,
  ) => (
    <ActionPane
      side={side}
      actions={set}
      translation={translation}
      rowWidth={width}
      moved={moved}
      onRun={run}
      onCommitChange={(next) => {
        past.current = next;
        commitHaptic();
      }}
    />
  );

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      enabled={enabled}
      overshootLeft={fullSwipe && !!leading?.length}
      overshootRight={fullSwipe && !!trailing?.length}
      onSwipeableWillOpen={(direction) => {
        // Released past the commit point: run the primary instead of resting open.
        if (fullSwipe && past.current) {
          past.current = false;
          const primary = (direction === "left" ? leading : trailing)?.[0];
          if (primary) run(primary);
        }
      }}
      renderLeftActions={
        leading?.length
          ? (_progress, translation) => pane("leading", leading, translation)
          : undefined
      }
      renderRightActions={
        trailing?.length
          ? (_progress, translation) => pane("trailing", trailing, translation)
          : undefined
      }
    >
      <View
        onLayout={(event) => {
          setWidth(width, event.nativeEvent.layout.width);
        }}
      >
        <RowCapsule moved={moved} />
        {children}
      </View>
    </ReanimatedSwipeable>
  );
}
