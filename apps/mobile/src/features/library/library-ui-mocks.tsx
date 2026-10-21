import { useImperativeHandle } from "react";
import type { ReactNode, Ref } from "react";
import { View } from "react-native";

/**
 * Jest stand-ins for the two native-animation modules the library screens
 * use, whose Reanimated runtime has no Jest build here (the shared mock in
 * `src/test/setup.ts` cannot load worklets). Each test file registers them:
 *
 *   jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () =>
 *     require("./library-ui-mocks").swipeable);
 *   jest.mock("~/components/ui/skeleton", () =>
 *     require("./library-ui-mocks").skeleton);
 */

type SwipeableStandInProps = {
  ref?: Ref<{ close: () => void }>;
  children?: ReactNode;
  renderRightActions?: () => ReactNode;
};

/** A resting swipeable: its row, with the revealed action rendered beside it. */
function SwipeableStandIn({
  ref,
  children,
  renderRightActions,
}: SwipeableStandInProps) {
  useImperativeHandle(ref, () => ({ close: () => {} }));
  return (
    <View>
      {children}
      {renderRightActions?.()}
    </View>
  );
}

export const swipeable = { __esModule: true, default: SwipeableStandIn };

function SkeletonPulse({ children }: { children: ReactNode }) {
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {children}
    </View>
  );
}

export const skeleton = { SkeletonPulse, SkeletonBlock: View };
