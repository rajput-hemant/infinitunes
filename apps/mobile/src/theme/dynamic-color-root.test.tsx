import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { DynamicColorRoot } from "./dynamic-color-root.android";
import { colors } from "./tokens";

jest.mock("nativewind", () => ({
  vars: (variables: Record<string, string>) => ({ variables }),
}));
jest.mock("./android-colors.android", () => ({
  hasDynamicColor: true,
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
});
