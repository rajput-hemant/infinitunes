import { toCardItem } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";
import { act, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderWithProviders } from "~/test/render";

import { Shelf } from "./shelf";

let mockOnLoad: (() => void) | undefined;
jest.mock("@shopify/flash-list", () => ({
  FlashList: ({ onLoad }: { onLoad: () => void }) => {
    mockOnLoad = onLoad;
    return null;
  },
}));

it("replaces the Android shelf skeleton only when the native list has drawn its items", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  await renderWithProviders(
    <Shelf title="Trending Now" items={[toCardItem(rawAlbum())]} />,
  );
  expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
  expect(screen.queryByRole("header", { name: "Trending Now" })).toBeNull();

  await act(async () => mockOnLoad?.());
  await waitFor(() =>
    expect(screen.queryAllByLabelText("Loading")).toHaveLength(0),
  );
  expect(
    screen.getByRole("header", { name: "Trending Now" }),
  ).toBeOnTheScreen();
});
