import { act, render, screen } from "@testing-library/react-native";
import { AppState, Text } from "react-native";

import { refreshDynamicPalettes } from "./android-colors.android";
import { DynamicColorRoot } from "./dynamic-color-root.android";
import { colors } from "./tokens";

jest.mock("nativewind", () => ({
  vars: (variables: Record<string, string>) => ({ variables }),
}));
jest.mock("./android-colors.android", () => ({
  hasDynamicColor: true,
  refreshDynamicPalettes: jest.fn(),
  paletteFor: (scheme: "light" | "dark") => ({
    ...jest.requireActual("./tokens").colors[scheme],
    primary: `#${scheme}-dynamic-primary`,
  }),
}));

describe("DynamicColorRoot (Android)", () => {
  it("sets the colour classes' variables from the dynamic palette", async () => {
    await render(
      <DynamicColorRoot>
        <Text>Inside</Text>
      </DynamicColorRoot>,
    );

    expect(screen.getByText("Inside")).toBeOnTheScreen();
    const style = [screen.root?.props.style].flat(Infinity);
    expect(style).toContainEqual({
      variables: expect.objectContaining({
        "--primary": "#light-dynamic-primary",
        "--background": colors.light.background,
      }),
    });
  });

  it("reads the roles anew when the app comes back to the foreground", async () => {
    const listeners: ((state: string) => void)[] = [];
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        listeners.push(listener);
        return { remove: jest.fn() };
      });
    await render(
      <DynamicColorRoot>
        <Text>Inside</Text>
      </DynamicColorRoot>,
    );

    await act(() => listeners[0]?.("background"));
    expect(refreshDynamicPalettes).not.toHaveBeenCalled();
    await act(() => listeners[0]?.("active"));
    expect(refreshDynamicPalettes).toHaveBeenCalledTimes(1);
  });
});
