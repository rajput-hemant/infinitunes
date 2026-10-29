import { screen } from "@testing-library/react-native";
import { Platform, StyleSheet, Text } from "react-native";

import { renderWithProviders } from "~/test/render";

import { ScreenScrollView } from "./screen-scroll-view";

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useNavigation: () => ({ setOptions: jest.fn() }),
}));

describe("ScreenScrollView", () => {
  afterEach(() => jest.restoreAllMocks());

  it("keeps a root screen's content under its in-layout Android bar", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderWithProviders(
      <ScreenScrollView testID="scroll">
        <Text>Row</Text>
      </ScreenScrollView>,
    );

    const style = StyleSheet.flatten(
      screen.getByTestId("scroll").props.contentContainerStyle,
    );
    expect(style.paddingTop).toBe(0);
  });
});
