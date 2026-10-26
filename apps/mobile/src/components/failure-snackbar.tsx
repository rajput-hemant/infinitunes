import { useSegments } from "expo-router";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import {
  dismissFailure,
  holdFailure,
  releaseFailure,
  useFailure,
  type Failure,
} from "~/lib/failure";
import { hasTabBarAccessory } from "~/lib/platform";
import { useFloatingDockOffset } from "~/navigation/player-dock";
import { springs } from "~/theme/motion";
import { sizes, space } from "~/theme/tokens";

import {
  SnackbarLayer,
  SnackbarSurface,
  snackbarEntering,
  snackbarExiting,
} from "./snackbar-surface";

/** A drag this far (or a flick) sends the snackbar away. */
const DISMISS_DISTANCE = sizes.touch;
/** Points per second (the gesture handler's unit). */
const DISMISS_VELOCITY = 500;

const fadeIn = FadeIn.duration(200).reduceMotion(ReduceMotion.Never);
const fadeOut = FadeOut.duration(150).reduceMotion(ReduceMotion.Never);

/**
 * Where the snackbar sits: over the tabs it clears the tab bar and the mini
 * player (the iOS 26 accessory, about a touch target tall, or the floating
 * dock); over a modal or sheet, just the home indicator.
 */
function useBottomOffset() {
  const inTabs = useSegments()[0] === "(tabs)";
  const dock = useFloatingDockOffset();
  const safeBottom = useSafeAreaInsets().bottom;
  if (!inTabs) return safeBottom + space.lg;
  return dock + (hasTabBarAccessory ? sizes.touch : sizes.dock) + space.sm;
}

/**
 * The failure snackbar (`showFailure`), mounted once in the root layout: a
 * Material 3 snackbar on Android, a glass banner on iOS. One at a time, the
 * newest replacing the last; it leaves on its own, on a tap, on a swipe, or
 * with a screen reader's escape gesture. Under reduce motion it only fades.
 */
export function FailureSnackbar() {
  const failure = useFailure();
  const bottom = useBottomOffset();
  return (
    <SnackbarLayer>
      <View
        pointerEvents="box-none"
        // Kept as a real view, or the live region is flattened away.
        collapsable={false}
        style={[styles.anchor, { bottom }]}
        accessibilityLiveRegion="polite"
      >
        {failure ? <Card key={failure.id} failure={failure} /> : null}
      </View>
    </SnackbarLayer>
  );
}

function Card({ failure }: { failure: Failure }) {
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const dismiss = () => dismissFailure(failure.id);
  const act = () => {
    dismiss();
    failure.action?.onPress();
  };
  const pan = usePanGesture({
    testID: "failure-snackbar-pan",
    // Down or sideways, past a small slop; up is left to the page.
    activeOffsetX: [-space.sm, space.sm],
    activeOffsetY: space.sm,
    onActivate: () => {
      "worklet";
      // The message stays while a finger is on it.
      scheduleOnRN(holdFailure, failure.id);
    },
    onUpdate: (event) => {
      "worklet";
      x.set(event.translationX);
      y.set(Math.max(event.translationY, 0));
    },
    onDeactivate: (event) => {
      "worklet";
      const away =
        !event.canceled &&
        (Math.abs(event.translationX) > DISMISS_DISTANCE ||
          event.translationY > DISMISS_DISTANCE / 2 ||
          Math.abs(event.velocityX) > DISMISS_VELOCITY ||
          event.velocityY > DISMISS_VELOCITY);
      if (away) {
        scheduleOnRN(dismissFailure, failure.id);
        return;
      }
      scheduleOnRN(releaseFailure, failure.id);
      x.set(withSpring(0, springs.spatialDefault));
      y.set(withSpring(0, springs.spatialDefault));
    },
  });
  const dragStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(Math.abs(x.value) / (DISMISS_DISTANCE * 3), 0.6),
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View
      entering={reduceMotion ? fadeIn : snackbarEntering}
      exiting={reduceMotion ? fadeOut : snackbarExiting}
      style={styles.card}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={dragStyle}>
          <Pressable
            onPress={dismiss}
            accessibilityRole="alert"
            accessibilityLabel={failure.message}
            accessibilityHint="Dismisses the message"
            // One element for a screen reader; the action is a custom action.
            accessibilityActions={[
              { name: "activate" },
              // Android has no platform escape: a custom action needs its label.
              { name: "escape", label: "Dismiss" },
              ...(failure.action
                ? [{ name: "action", label: failure.action.label }]
                : []),
            ]}
            onAccessibilityAction={(event) =>
              event.nativeEvent.actionName === "action" ? act() : dismiss()
            }
            onAccessibilityEscape={dismiss}
          >
            <SnackbarSurface failure={failure} onAction={act} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: sizes.page,
    right: sizes.page,
    // Material's snackbar spans the gutters; iOS's banner hugs its text.
    alignItems: Platform.OS === "ios" ? "center" : "stretch",
  },
  card: { maxWidth: "100%" },
});
