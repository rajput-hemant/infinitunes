import { act } from "@testing-library/react-native";
import { impactAsync } from "expo-haptics";
import type { ReactNode } from "react";
import * as Reanimated from "react-native-reanimated";

import { renderWithProviders } from "~/test/render";

import { SwipeableRow } from "./swipeable-row";

jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated"),
  useAnimatedReaction: jest.fn(),
}));

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => ({
  __esModule: true,
  default: ({
    children,
    renderRightActions,
  }: {
    children: ReactNode;
    renderRightActions: (
      progress: unknown,
      translation: { value: number },
    ) => ReactNode;
  }) => (
    <>
      {children}
      {renderRightActions(undefined, { value: 0 })}
    </>
  ),
}));

it("buzzes only when a swipe crosses the commit point, not on its initial reaction", async () => {
  const reaction = jest.mocked(Reanimated.useAnimatedReaction);
  await renderWithProviders(
    <SwipeableRow
      trailing={[{ label: "Remove", icon: "trash", onPress: jest.fn() }]}
    >
      {null}
    </SwipeableRow>,
  );
  const react = reaction.mock.calls[0]?.[1];
  if (!react) throw new Error("Missing swipe reaction");

  await act(async () => react(false, null));
  expect(impactAsync).not.toHaveBeenCalled();

  await act(async () => react(true, false));
  expect(impactAsync).toHaveBeenCalledTimes(1);
  await act(async () => react(false, true));
  expect(impactAsync).toHaveBeenCalledTimes(2);
});
