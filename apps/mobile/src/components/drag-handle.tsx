import { Pressable } from "react-native";
import { useReorderableDrag } from "react-native-reorderable-list";

import { dragStart } from "~/lib/haptics";

import { Icon } from "./ui/icon";

/**
 * What moves a row without dragging it (screen readers cannot drag). A
 * direction the row cannot go in is left out.
 */
export type ReorderActions = {
  moveUp?: () => void;
  moveDown?: () => void;
};

const ACTION_LABELS = {
  moveUp: "Move up",
  moveDown: "Move down",
} as const;

/**
 * Pressing and dragging it moves its row (only inside a `ReorderableList`);
 * the same moves are screen-reader actions on the handle.
 */
export function DragHandle({
  name,
  actions = {},
}: {
  name: string;
  actions?: ReorderActions;
}) {
  const drag = useReorderableDrag();
  const available = (["moveUp", "moveDown"] as const).filter(
    (action) => actions[action],
  );
  return (
    <Pressable
      onPressIn={() => {
        // The row lifts: a tick as the drag starts.
        dragStart();
        drag();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Reorder ${name}`}
      accessibilityHint="Drag to move"
      accessibilityActions={available.map((action) => ({
        name: action,
        label: ACTION_LABELS[action],
      }))}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "moveUp") actions.moveUp?.();
        if (nativeEvent.actionName === "moveDown") actions.moveDown?.();
      }}
      className="size-touch items-center justify-center"
    >
      <Icon
        name={{ ios: "line.3.horizontal", android: "drag_handle" }}
        size="md"
      />
    </Pressable>
  );
}
