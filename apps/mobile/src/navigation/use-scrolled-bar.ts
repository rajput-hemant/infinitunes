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
  const navigation = useNavigation();
  const card = usePalette().card;
  const scrolled = useRef(false);
  return useMemo(
    () =>
      Platform.OS === "android"
        ? {
            onScroll: ({ nativeEvent }) => {
              const under = nativeEvent.contentOffset.y > 0;
              // Only a change touches the navigator.
              if (under === scrolled.current) return;
              scrolled.current = under;
              navigation.setOptions({
                headerStyle: under ? { backgroundColor: card } : undefined,
              });
            },
            scrollEventThrottle: 16,
          }
        : {},
    [navigation, card],
  );
}
