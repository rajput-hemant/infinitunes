import { render, screen } from "@testing-library/react-native";
import { HeaderHeightContext } from "expo-router/react-navigation";
import { getAnimatedStyle, makeMutable } from "react-native-reanimated";

import { BarScrim, scrimOpacity } from "./bar-scrim";

describe("scrimOpacity", () => {
  it("is clear at the top, opaque from the bar's height on, linear between", () => {
    expect(scrimOpacity(0, 80)).toBe(0);
    expect(scrimOpacity(-30, 80)).toBe(0);
    expect(scrimOpacity(20, 80)).toBe(0.25);
    expect(scrimOpacity(40, 80)).toBe(0.5);
    expect(scrimOpacity(80, 80)).toBe(1);
    expect(scrimOpacity(400, 80)).toBe(1);
  });
});

describe("BarScrim", () => {
  it("follows the offset over the header's height", async () => {
    const offset = makeMutable(40);
    await render(
      <HeaderHeightContext value={80}>
        <BarScrim offset={offset} color="background" />
      </HeaderHeightContext>,
    );

    // Its web typings take no argument; the native build reads the element.
    const style = (
      getAnimatedStyle as unknown as (element: unknown) => { opacity?: number }
    )(screen.getByTestId("bar-scrim"));
    expect(style.opacity).toBe(0.5);
  });
});
