import { useImperativeHandle } from "react";
import type { ReactNode, Ref } from "react";
import { View } from "react-native";

/**
 * `react-native-gesture-handler/ReanimatedSwipeable` in every suite
 * (`src/test/setup.ts`). Gesture Handler 3.3's swipeable attaches
 * shared-value listeners from a scheduled worklet that throws under
 * Reanimated's Jest runtime inside a router, so it stands in at rest: the row
 * with its revealed actions beside it, and the `close()` handle.
 */

type SwipeableProps = {
  ref?: Ref<{ close: () => void }>;
  children?: ReactNode;
  renderLeftActions?: () => ReactNode;
  renderRightActions?: () => ReactNode;
};

function Swipeable({
  ref,
  children,
  renderLeftActions,
  renderRightActions,
}: SwipeableProps) {
  useImperativeHandle(ref, () => ({ close: () => {} }));
  return (
    <View>
      {renderLeftActions?.()}
      {children}
      {renderRightActions?.()}
    </View>
  );
}

export default Swipeable;
