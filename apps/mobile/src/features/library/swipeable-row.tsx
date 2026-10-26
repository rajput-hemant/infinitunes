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
import { commit as commitHaptic } from "~/lib/haptics";
import { useTokenColor } from "~/theme/use-palette";

export type SwipeAction = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
};

/** A swipe past this share of the row's width commits the action (iOS Mail). */
export const FULL_SWIPE_SHARE = 0.6;

/** Whether a (negative, leftward) translation is a full swipe of a row `width` wide. */
export function isFullSwipe(translation: number, width: number): boolean {
  "worklet";
  return width > 0 && -translation > width * FULL_SWIPE_SHARE;
}

// A helper, not an inline write: the react lint rejects mutating a shared value in render.
function setWidth(width: SharedValue<number>, next: number) {
  width.value = next;
}

/** Reports, from the UI thread, whether the drag is currently past the commit point. */
function FullSwipeWatcher({
  translation,
  width,
  onChange,
}: {
  translation: SharedValue<number>;
  width: SharedValue<number>;
  onChange: (past: boolean) => void;
}) {
  useAnimatedReaction(
    () => isFullSwipe(translation.value, width.value),
    (past, previous) => {
      if (previous !== null && past !== previous) scheduleOnRN(onChange, past);
    },
  );
  return null;
}

/**
 * A row with one destructive action behind a left swipe. The swipe is a
 * shortcut: every action also lives in the row's own menu. On iOS a full swipe
 * (past `FULL_SWIPE_SHARE` of the row) runs the action on release.
 */
export function SwipeableRow({
  action,
  children,
}: {
  action: SwipeAction;
  children: ReactNode;
}) {
  const ink = useTokenColor("destructive-foreground");
  const swipeable = useRef<SwipeableMethods>(null);
  // iOS only: Android keeps the revealed button.
  const fullSwipe = Platform.OS === "ios";
  const width = useSharedValue(0);
  const past = useRef(false);
  const commit = () => {
    swipeable.current?.close();
    action.onPress();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      overshootRight={fullSwipe}
      onSwipeableWillOpen={() => {
        // Released past the commit point: run the action instead of resting open.
        if (fullSwipe && past.current) {
          past.current = false;
          commit();
        }
      }}
      renderRightActions={(_progress, translation) => (
        <>
          {fullSwipe && translation ? (
            <FullSwipeWatcher
              translation={translation}
              width={width}
              onChange={(next) => {
                past.current = next;
                // Crossing the commit point ticks, in either direction.
                commitHaptic();
              }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={commit}
            className="min-w-row items-center justify-center gap-1 bg-destructive px-4"
          >
            {/* The destructive fill's own text colour: white fails AA on dark's lighter red. */}
            <Icon name={action.icon} size="md" color={ink} />
            <Text variant="caption" tone="onDestructive">
              {action.label}
            </Text>
          </Pressable>
        </>
      )}
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
