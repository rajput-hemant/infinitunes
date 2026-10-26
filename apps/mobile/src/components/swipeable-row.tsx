import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Platform, Pressable, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import type { TextTone } from "~/components/ui/text";
import { commit as commitHaptic } from "~/lib/haptics";
import { useTokenColor } from "~/theme/use-palette";

/** A swipe button's fill and ink: the palette's own pairs. */
const TONES = {
  primary: { fill: "bg-primary", ink: "primary-foreground", text: "onPrimary" },
  accent: { fill: "bg-accent", ink: "accent-foreground", text: "default" },
  destructive: {
    fill: "bg-destructive",
    ink: "destructive-foreground",
    text: "onDestructive",
  },
} as const satisfies Record<
  string,
  { fill: string; ink: string; text: TextTone }
>;

export type SwipeAction = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  /** Defaults to `destructive`. */
  tone?: keyof typeof TONES;
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

/** Reports, from the UI thread, whether the drag is currently at the commit point. */
function CommitWatcher({
  translation,
  width,
  side,
  onChange,
}: {
  translation: SharedValue<number>;
  width: SharedValue<number>;
  side: SwipeSide;
  onChange: (past: boolean) => void;
}) {
  const last = useSharedValue({ x: 0, t: 0 });
  useAnimatedReaction(
    () => {
      const x = translation.value;
      return shouldCommitSwipe({
        translation: x,
        velocity: sampleVelocity(last, x),
        width: width.value,
        side,
      });
    },
    (past, previous) => {
      if (previous !== null && past !== previous) scheduleOnRN(onChange, past);
    },
  );
  return null;
}

function ActionButton({
  action,
  onRun,
}: {
  action: SwipeAction;
  onRun: (action: SwipeAction) => void;
}) {
  const tone = TONES[action.tone ?? "destructive"];
  const ink = useTokenColor(tone.ink);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={() => {
        onRun(action);
      }}
      className={`min-w-row items-center justify-center gap-1 px-4 ${tone.fill}`}
    >
      <Icon name={action.icon} size="md" color={ink} />
      <Text variant="caption" tone={tone.text}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * A row with action buttons behind a swipe: `leading` (left to right) and/or
 * `trailing` (right to left). The swipe is a shortcut: every action also lives in
 * the row's menu and as a screen reader action. A slow swipe that stops reveals
 * the buttons (tap one to run it); on iOS a fling or a swipe past
 * `FULL_SWIPE_SHARE` runs the side's first action on release (`shouldCommitSwipe`).
 */
export function SwipeableRow({
  leading,
  trailing,
  children,
}: {
  leading?: readonly SwipeAction[];
  trailing?: readonly SwipeAction[];
  children: ReactNode;
}) {
  const swipeable = useRef<SwipeableMethods>(null);
  // iOS only: Android keeps the revealed buttons.
  const fullSwipe = Platform.OS === "ios";
  const width = useSharedValue(0);
  const past = useRef(false);
  const run = (action: SwipeAction) => {
    swipeable.current?.close();
    action.onPress();
  };

  const actions = (
    side: SwipeSide,
    set: readonly SwipeAction[],
    translation: SharedValue<number> | undefined,
  ) => (
    <>
      {fullSwipe && translation ? (
        <CommitWatcher
          translation={translation}
          width={width}
          side={side}
          onChange={(next) => {
            past.current = next;
            // Crossing the commit point ticks, in either direction.
            commitHaptic();
          }}
        />
      ) : null}
      {/* The first action is outermost, as in UIKit. */}
      <View className={side === "leading" ? "flex-row" : "flex-row-reverse"}>
        {set.map((action) => (
          <ActionButton key={action.label} action={action} onRun={run} />
        ))}
      </View>
    </>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      overshootLeft={fullSwipe && !!leading?.length}
      overshootRight={fullSwipe && !!trailing?.length}
      onSwipeableWillOpen={(direction) => {
        // Released past the commit point: run the first action instead of resting open.
        if (fullSwipe && past.current) {
          past.current = false;
          const first = (direction === "left" ? leading : trailing)?.[0];
          if (first) run(first);
        }
      }}
      renderLeftActions={
        leading?.length
          ? (_progress, translation) => actions("leading", leading, translation)
          : undefined
      }
      renderRightActions={
        trailing?.length
          ? (_progress, translation) =>
              actions("trailing", trailing, translation)
          : undefined
      }
    >
      {/* Opaque, or the action behind shows through the resting row. */}
      <View
        className="bg-background"
        onLayout={(event) => {
          setWidth(width, event.nativeEvent.layout.width);
        }}
      >
        {children}
      </View>
    </ReanimatedSwipeable>
  );
}
