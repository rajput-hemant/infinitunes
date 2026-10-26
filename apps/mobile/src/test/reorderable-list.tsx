import { FlatList } from "react-native";
import type { FlatListProps } from "react-native";

/**
 * `react-native-reorderable-list` in every suite (`src/test/setup.ts`): its
 * list measures itself through a callable Reanimated animated ref, which
 * Reanimated's Jest runtime does not provide. A plain `FlatList` stands in;
 * a test reorders with `fireEvent(screen.getByTestId("reorderable-list"),
 * "reorder", { from, to })`, which reaches this component's `onReorder`.
 */

type ReorderableListProps<Item> = FlatListProps<Item> & {
  onReorder: (event: { from: number; to: number }) => void;
};

function ReorderableList<Item>({
  onReorder: _onReorder,
  ...props
}: ReorderableListProps<Item>) {
  return <FlatList testID="reorderable-list" {...props} />;
}

/** Whether the row is being dragged; a test sets it to simulate a drag. */
export const reorderState = { active: false };

export function useIsActive() {
  return reorderState.active;
}

/** The real hook starts the row's drag; at rest it does nothing. */
export function useReorderableDrag() {
  return () => {};
}

export default ReorderableList;
