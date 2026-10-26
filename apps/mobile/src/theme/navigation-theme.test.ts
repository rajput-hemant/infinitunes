import { renderHook } from "@testing-library/react-native";

import { withAccent } from "./accent-palette.android";
import { appearanceStore } from "./appearance";
import { colors } from "./tokens";

jest.mock("./accent-palette", () =>
  jest.requireActual("./accent-palette.android"),
);
jest.mock("./android-colors", () => ({
  paletteFor: (scheme: "light" | "dark") =>
    jest.requireActual("./tokens").colors[scheme],
}));

// The Android chrome: Jest resolves the bare name to the iOS module.
const { useNavigationTheme } =
  // oxlint-disable-next-line typescript/no-require-imports
  require("./navigation-theme.ts") as typeof import("./navigation-theme");

describe("useNavigationTheme (Android)", () => {
  beforeEach(() => {
    appearanceStore.getState().setAccent("default");
  });

  it("puts the chrome on the accent's scheme", async () => {
    appearanceStore.getState().setAccent("purple");
    const { result } = await renderHook(() => useNavigationTheme());
    const palette = withAccent(colors.light, "purple", "light");
    expect(result.current.colors).toMatchObject({
      primary: palette.primary,
      background: palette.background,
      card: palette.background,
      text: palette.foreground,
    });
  });
});
