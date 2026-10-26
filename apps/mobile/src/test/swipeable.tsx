import { useImperativeHandle } from "react";
import type { ReactNode, Ref } from "react";
import { View } from "react-native";

/**
 * `react-native-gesture-handler/ReanimatedSwipeable` in every suite
 * (`src/test/setup.ts`). Under Reanimated's Jest runtime the real one fails
 * in Gesture Handler 3.3's JS-responder hook ("sharedValue.addListener is not
 * a function") and the test times out, so it stands in at rest: the row with
 * its revealed actions beside it, and the `close()` handle.
 */

type SwipeableProps = {
  ref?: Ref<{ close: () => void }>;
  children?: ReactNode;
  renderLeftActions?: () => ReactNode;
  renderRightActions?: () => ReactNode;
  enabled?: boolean;
};

function Swipeable({
  ref,
  children,
  renderLeftActions,
  renderRightActions,
  enabled = true,
}: SwipeableProps) {
  useImperativeHandle(ref, () => ({ close: () => {} }));
  return (
    <View testID="swipeable" accessibilityState={{ disabled: !enabled }}>
      {renderLeftActions?.()}
      {children}
      {renderRightActions?.()}
    </View>
  );
}

export default Swipeable;
