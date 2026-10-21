import { Pressable } from "react-native";
import { useReorderableDrag } from "react-native-reorderable-list";

import { Icon } from "./ui/icon";

/** Pressing and dragging it moves its row (only inside a `ReorderableList`). */
export function DragHandle({ name }: { name: string }) {
  const drag = useReorderableDrag();
  return (
    <Pressable
      onPressIn={drag}
      accessibilityRole="button"
      accessibilityLabel={`Reorder ${name}`}
      className="size-ctl items-center justify-center"
    >
      <Icon
        name={{ ios: "line.3.horizontal", android: "drag_handle" }}
        size={18}
      />
    </Pressable>
  );
}
