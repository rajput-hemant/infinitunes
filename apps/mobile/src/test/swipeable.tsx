import { useImperativeHandle } from "react";
import type { ReactNode, Ref } from "react";
import { View } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

/**
 * `react-native-gesture-handler/ReanimatedSwipeable` in every suite
 * (`src/test/setup.ts`). Under Reanimated's Jest runtime the real one fails
 * in Gesture Handler 3.3's JS-responder hook ("sharedValue.addListener is not
 * a function") and the test times out, so it stands in at rest: the row with
 * its revealed actions beside it, and the `close()` handle.
 */

type RenderActions = (
  progress: SharedValue<number>,
  translation: SharedValue<number>,
) => ReactNode;

type SwipeableProps = {
  ref?: Ref<{ close: () => void }>;
  children?: ReactNode;
  renderLeftActions?: RenderActions;
  renderRightActions?: RenderActions;
  enabled?: boolean;
};

function Swipeable({
  ref,
  children,
  renderLeftActions,
  renderRightActions,
  enabled = true,
}: SwipeableProps) {
  const progress = useSharedValue(0);
  const translation = useSharedValue(0);
  useImperativeHandle(ref, () => ({ close: () => {} }));
  return (
    <View testID="swipeable" accessibilityState={{ disabled: !enabled }}>
      {renderLeftActions?.(progress, translation)}
      {children}
      {renderRightActions?.(progress, translation)}
    </View>
  );
}

export default Swipeable;
