import { useNavigation } from "expo-router";
import { useMemo, useRef } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { usePalette } from "~/theme/use-palette";

type ScrolledBarProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
};

/**
 * Material 3's scrolled top app bar for a tab's root screen: the flat bar
 * takes the `card` container once its content scrolls under it and returns
 * to the surface at the top. Spread the result on the screen's one scroll
 * view (`ScreenScrollView` already does; a `FlashList` spreads it itself,
 * after its own props). iOS's glass bar separates itself: no props there.
 */
export function useScrolledBar(): ScrolledBarProps {
  const setUnder = useScrolledBarSetter();
  return useMemo(
    () =>
      setUnder
        ? {
            onScroll: ({ nativeEvent }) =>
              setUnder(nativeEvent.contentOffset.y > 0),
            scrollEventThrottle: 16,
          }
        : {},
    [setUnder],
  );
}

/**
 * The worklet side of `useScrolledBarSetter`: crosses to JS (`schedule`, e.g.
 * `scheduleOnRN`) only when the content goes under the bar or back. `last`
 * is a shared value holding the side the bar is on.
 */
export function crossesBar(
  offsetY: number,
  last: { value: boolean },
  set: ((under: boolean) => void) | undefined,
  schedule: (fn: (under: boolean) => void, under: boolean) => void,
) {
  "worklet";
  const under = offsetY > 0;
  if (!set || under === last.value) return;
  last.value = under;
  schedule(set, under);
}

/**
 * The same bar tint as a plain setter, for a list whose `onScroll` must be a
 * Reanimated handler (`ReorderableList`): call it from the worklet with
 * `scheduleOnRN` when the content goes under the bar or back. `undefined` on
 * iOS.
 */
export function useScrolledBarSetter(): ((under: boolean) => void) | undefined {
  const navigation = useNavigation();
  const card = usePalette().card;
  const scrolled = useRef(false);
  return useMemo(
    () =>
      Platform.OS === "android"
        ? (under: boolean) => {
            // Only a change touches the navigator.
            if (under === scrolled.current) return;
            scrolled.current = under;
            navigation.setOptions({
              headerStyle: under ? { backgroundColor: card } : undefined,
            });
          }
        : undefined,
    [navigation, card],
  );
}
