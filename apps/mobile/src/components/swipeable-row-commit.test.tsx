import { act, screen, userEvent } from "@testing-library/react-native";
import type { ReactNode } from "react";
import * as Reanimated from "react-native-reanimated";

import { renderWithProviders } from "~/test/render";

import { SwipeableRow } from "./swipeable-row";

jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated"),
  __esModule: true,
  default: jest.requireActual("react-native-reanimated").default,
  useAnimatedReaction: jest.fn(),
}));

type Props = {
  children: ReactNode;
  renderLeftActions: (progress: unknown, translation: unknown) => ReactNode;
  onSwipeableWillOpen: (direction: "left" | "right") => void;
};
let props: Props;
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => ({
  __esModule: true,
  default: (next: Props) => {
    props = next;
    return (
      <>
        {next.children}
        {next.renderLeftActions(undefined, { value: 0 })}
      </>
    );
  },
}));

const first = jest.fn();
const second = jest.fn();
const leading = [
  {
    label: "First",
    icon: "plus" as const,
    tone: "indigo" as const,
    onPress: first,
  },
  {
    label: "Second",
    icon: "plus" as const,
    tone: "orange" as const,
    onPress: second,
  },
];

beforeEach(() => {
  first.mockClear();
  second.mockClear();
});

it("runs the first action when released past the commit point", async () => {
  await renderWithProviders(
    <SwipeableRow leading={leading}>{null}</SwipeableRow>,
  );
  const react = jest.mocked(Reanimated.useAnimatedReaction).mock.calls[0]?.[1];
  if (!react) throw new Error("Missing swipe reaction");

  await act(async () => react(true, false));
  await act(async () => props.onSwipeableWillOpen("left"));

  expect(first).toHaveBeenCalledTimes(1);
  expect(second).not.toHaveBeenCalled();
});

it("only reveals the buttons when released short of it, and a tap runs one", async () => {
  await renderWithProviders(
    <SwipeableRow leading={leading}>{null}</SwipeableRow>,
  );

  await act(async () => props.onSwipeableWillOpen("left"));
  expect(first).not.toHaveBeenCalled();

  await userEvent.press(screen.getByRole("button", { name: "Second" }));
  expect(second).toHaveBeenCalledTimes(1);
});
