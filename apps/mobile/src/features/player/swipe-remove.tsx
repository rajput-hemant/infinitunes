import type { ReactNode } from "react";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useIsActive } from "react-native-reorderable-list";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { commit as commitHaptic } from "~/lib/haptics";
import { useTokenColor } from "~/theme/use-palette";

/** A swipe past this share of the row's width removes it on release (Apple's Up Next). */
const FULL_SWIPE_SHARE = 0.6;
/** A fling faster than this (points a second, leftward) removes it, once it has travelled `FLING_MIN_DISTANCE`. */
const FLING_VELOCITY = 1200;
const FLING_MIN_DISTANCE = 40;

/**
 * Whether a release removes the row at once: dragged past 60% of its width,
 * or flung leftward. `translation` and `velocity` are negative going left.
 * Anything slower and shorter rests open with the Remove button showing.
 * One function so another swipe component can swap its rule in.
 */
export function swipeCommits(
  translation: number,
  velocity: number,
  width: number,
): boolean {
  "worklet";
  if (width <= 0) return false;
  const distance = -translation;
  return (
    distance > width * FULL_SWIPE_SHARE ||
    (distance > FLING_MIN_DISTANCE && -velocity > FLING_VELOCITY)
  );
}

/** The Remove button, shown only once the row has moved; reports the commit point from the UI thread. */
function RemovePane({
  translation,
  width,
  onCommitChange,
  onPress,
}: {
  translation?: SharedValue<number>;
  width: SharedValue<number>;
  onCommitChange: (commits: boolean) => void;
  onPress: () => void;
}) {
  const ink = useTokenColor("destructive-foreground");
  const velocity = useSharedValue(0);
  const last = useSharedValue({ at: 0, translation: 0 });
  const fallback = useSharedValue(0);
  const moved = translation ?? fallback;

  useAnimatedReaction(
    () => moved.get(),
    (current, previous) => {
      const now = Date.now();
      const before = last.get();
      const dt = now - before.at;
      velocity.set(
        dt > 0 && dt < 200 ? ((current - before.translation) / dt) * 1000 : 0,
      );
      last.set({ at: now, translation: current });
      const commits = swipeCommits(current, velocity.get(), width.get());
      const was =
        previous === null
          ? false
          : swipeCommits(previous, velocity.get(), width.get());
      if (commits !== was) scheduleOnRN(onCommitChange, commits);
    },
  );
  // At rest the row covers the pane, but it is transparent over the wash.
  const style = useAnimatedStyle(() => ({
    opacity: translation && translation.value >= -1 ? 0 : 1,
  }));

  return (
    <Animated.View style={style} className="bg-destructive">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove"
        onPress={onPress}
        className="min-w-row flex-1 items-center justify-center gap-1 px-4"
      >
        <Icon
          name={{ ios: "minus.circle", android: "remove" }}
          size="md"
          color={ink}
        />
        <Text variant="caption" tone="onDestructive">
          Remove
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Apple Music's Up next swipe: leftward (trailing) reveals a red Remove. A
 * slow swipe that stops leaves it in place (tap to confirm); a fling or a
 * swipe past 60% removes on release, with the commit haptic. No undo, as in
 * Apple's. A reorder drag disables it, so the drag handle never swipes.
 */
export function SwipeToRemove({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: ReactNode;
}) {
  const dragging = useIsActive();
  const swipeable = useRef<SwipeableMethods>(null);
  const width = useSharedValue(0);
  const commits = useRef(false);
  const remove = () => {
    commitHaptic();
    swipeable.current?.close();
    onRemove();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      enabled={!dragging}
      overshootRight
      onSwipeableWillOpen={() => {
        // Released past the commit point: remove instead of resting open.
        if (commits.current) {
          commits.current = false;
          remove();
        }
      }}
      renderRightActions={(_progress, translation) => (
        <RemovePane
          translation={translation}
          width={width}
          onCommitChange={(next) => {
            commits.current = next;
          }}
          onPress={remove}
        />
      )}
    >
      <View
        onLayout={(event) => {
          width.set(event.nativeEvent.layout.width);
        }}
      >
        {children}
      </View>
    </ReanimatedSwipeable>
  );
}
