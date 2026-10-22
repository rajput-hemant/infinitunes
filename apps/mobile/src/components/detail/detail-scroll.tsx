import { createContext, use, useMemo } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { art } from "~/theme/tokens";

/**
 * Past this offset the header artwork has left the screen and the entity's
 * title is going under the app bar.
 */
export const SCROLLED_UNDER_OFFSET = art.header;

/** `DetailFrame`'s setter for whether the page has scrolled under the bar. */
export const DetailScrollContext = createContext<
  ((scrolled: boolean) => void) | undefined
>(undefined);

type DetailScrollProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
};

/**
 * Spread on a detail page's one scroll view (a `ScrollView` or `FlashList`):
 * on Android it reports when the entity header scrolls under the top app bar,
 * which `DetailFrame` then tints and titles (Material 3's scrolled bar). iOS's
 * glass bar already separates itself, so there it adds nothing. Read at
 * render, so a test can switch platforms.
 */
export function useDetailScrollProps(): DetailScrollProps {
  const setScrolled = use(DetailScrollContext);
  const android = Platform.OS === "android";
  return useMemo(
    () =>
      android && setScrolled
        ? {
            // React skips the render when the flag did not change.
            onScroll: ({ nativeEvent }) =>
              setScrolled(nativeEvent.contentOffset.y > SCROLLED_UNDER_OFFSET),
            scrollEventThrottle: 16,
          }
        : {},
    [android, setScrolled],
  );
}
