import { screen } from "@testing-library/react-native";
import * as Font from "expo-font";
import { Platform } from "react-native";

import { renderWithProviders } from "~/test/render";

import { QuickPicks } from "./quick-picks";

jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  useFonts: jest.fn(),
}));

it("shows skeleton tiles until Android's symbol font is ready", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  const fonts = jest.mocked(Font.useFonts).mockReturnValue([false, null]);
  const app = await renderWithProviders(<QuickPicks items={[]} />);
  expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
  expect(screen.queryByText("Surprise Me")).toBeNull();

  fonts.mockReturnValue([true, null]);
  await app.rerender(<QuickPicks items={[]} />);
  expect(screen.getByText("Surprise Me")).toBeOnTheScreen();
  expect(screen.queryAllByLabelText("Loading")).toHaveLength(0);
});

it("keeps the actions usable after a font load failure", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  jest.mocked(Font.useFonts).mockReturnValue([false, new Error("font failed")]);
  await renderWithProviders(<QuickPicks items={[]} />);
  expect(screen.getByText("Surprise Me")).toBeOnTheScreen();
});
