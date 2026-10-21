import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { preferencesStore } from "~/lib/preferences";
import { renderScreen } from "~/test/render";

import { SettingsScreen } from "./settings-screen";

jest.mock("@expo/ui", () => require("~/test/expo-ui"));

const initialPreferences = preferencesStore.getState();
beforeEach(() => preferencesStore.setState(initialPreferences, true));

describe("SettingsScreen playback rows", () => {
  it("saves the image quality, starting from the default", async () => {
    await renderScreen(<SettingsScreen />);
    expect(screen.getByRole("menuitem", { name: "High" })).toBeSelected();

    await fireEvent.press(screen.getByRole("menuitem", { name: "Low" }));

    expect(preferencesStore.getState().imageQuality).toBe("low");
    expect(screen.getByRole("menuitem", { name: "Low" })).toBeSelected();
    expect(screen.getByRole("menuitem", { name: "High" })).not.toBeSelected();
    // The other quality settings are untouched.
    expect(preferencesStore.getState()).toMatchObject({
      streamQuality: "excellent",
      downloadQuality: "excellent",
    });
  });

  it("summarises the language choice and opens the picker", async () => {
    await renderScreen(<SettingsScreen />);
    const push = jest.spyOn(router, "push").mockImplementation(() => {});
    expect(screen.getByText("Hindi, English (default)")).toBeOnTheScreen();

    await act(async () =>
      preferencesStore.getState().setLanguages(["english", "tamil"]),
    );
    await fireEvent.press(screen.getByRole("button", { name: /^Languages/ }));

    expect(screen.getByText("English, Tamil")).toBeOnTheScreen();
    expect(push).toHaveBeenCalledWith("/languages");
    push.mockRestore();
  });
});
