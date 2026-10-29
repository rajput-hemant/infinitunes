import { HeaderHeightContext } from "expo-router/react-navigation";
import { createContext, use, useMemo } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { playerDockInset } from "~/navigation/player-dock";
import { art } from "~/theme/tokens";

/**
 * Past this offset the header artwork has left the screen and the entity's
 * title is going under the app bar.
 */
export const SCROLLED_UNDER_OFFSET = art.header;

/**
 * `DetailFrame`'s scroll state: the setter for whether the page has scrolled
 * under the bar (the bar's title) and the raw offset (Android's `BarScrim`).
 */
export const DetailScrollContext = createContext<
  | { setScrolled: (scrolled: boolean) => void; offset: SharedValue<number> }
  | undefined
>(undefined);

/**
 * The top inset a detail page's content needs: Android's detail bar is
 * transparent so the wash reaches the status bar, and
 * `contentInsetAdjustmentBehavior` does nothing there, so content starts the
 * bar's height down. 0 on iOS and outside a `DetailFrame`.
 */
export function useBarInset(): number {
  const height = use(HeaderHeightContext) ?? 0;
  const inDetail = use(DetailScrollContext) !== undefined;
  return Platform.OS === "android" && inDetail ? height : 0;
}

type DetailScrollProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: { paddingTop: number; paddingBottom: number };
};

/**
 * Spread on a detail page's one scroll view (a `ScrollView` or `FlashList`):
 * it reports when the entity header scrolls under the top bar, which
 * `DetailFrame` then titles, feeds Android's bar scrim the offset, and pads
 * the content clear of the bar and the player dock.
 */
export function useDetailScrollProps(): DetailScrollProps {
  const scroll = use(DetailScrollContext);
  const inset = useBarInset();
  return useMemo(
    () =>
      scroll
        ? {
            // React skips the render when the flag did not change.
            onScroll: ({ nativeEvent }) => {
              const y = nativeEvent.contentOffset.y;
              scroll.offset.set(y);
              scroll.setScrolled(y > SCROLLED_UNDER_OFFSET);
            },
            scrollEventThrottle: 16,
            contentContainerStyle: {
              paddingTop: inset,
              paddingBottom: playerDockInset,
            },
          }
        : {},
    [scroll, inset],
  );
}
