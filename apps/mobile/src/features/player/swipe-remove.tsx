import type { ReactNode } from "react";
import { useIsActive } from "react-native-reorderable-list";

import { SwipeableRow } from "~/components/swipeable-row";

/**
 * Apple Music's Up next swipe: leftward (trailing) reveals a red Remove
 * capsule. A slow swipe that stops leaves it in place (tap to confirm); a fling
 * or a swipe past 60% removes on release (`shouldCommitSwipe`). No undo, as in
 * Apple's. A reorder drag disables it, so the drag handle never swipes.
 */
export function SwipeToRemove({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: ReactNode;
}) {
  const dragging = useIsActive();
  return (
    <SwipeableRow
      enabled={!dragging}
      trailing={[
        {
          label: "Remove",
          icon: { ios: "minus.circle.fill", android: "remove_circle" },
          tone: "red",
          onPress: onRemove,
        },
      ]}
    >
      {children}
    </SwipeableRow>
  );
}
