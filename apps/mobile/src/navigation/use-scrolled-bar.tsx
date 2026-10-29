import { useNavigation } from "expo-router";
import { use, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { BarScrim } from "~/components/bar-scrim";
import { DetailScrollContext } from "~/components/detail/detail-scroll";

type ScrolledBarProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
};

/**
 * Material 3's scrolled top app bar for a tab's root screen, as a scrim: the
 * flat surface bar fades to the `card` container as content scrolls under it
 * and back at the top, following the offset frame by frame (`BarScrim` as the
 * screen's `headerBackground`, installed once). The bar stays in the layout,
 * so content needs no inset. `undefined` on iOS, whose glass bar separates
 * itself, and inside a detail page, whose `DetailFrame` owns the bar.
 */
export function useScrolledBarOffset(): SharedValue<number> | undefined {
  const navigation = useNavigation();
  const offset = useSharedValue(0);
  const enabled =
    Platform.OS === "android" && use(DetailScrollContext) === undefined;
  useEffect(() => {
    if (!enabled) return;
    navigation.setOptions({
      headerBackground: () => (
        <BarScrim offset={offset} color="card" base="background" />
      ),
    });
  }, [enabled, navigation, offset]);
  return enabled ? offset : undefined;
}

/** The scroll props that feed `offset` (empty without one). */
export function barScrollProps(
  offset: SharedValue<number> | undefined,
): ScrolledBarProps {
  return offset
    ? {
        onScroll: ({ nativeEvent }) => offset.set(nativeEvent.contentOffset.y),
        scrollEventThrottle: 16,
      }
    : {};
}

/**
 * Spread on a root screen's one scroll view (`ScreenScrollView` already
 * does; a `FlashList` spreads it itself, after its own props). A list whose
 * `onScroll` must be a Reanimated handler writes `useScrolledBarOffset()`
 * from its worklet instead.
 */
export function useScrolledBar(): ScrolledBarProps {
  const offset = useScrolledBarOffset();
  return useMemo(() => barScrollProps(offset), [offset]);
}
