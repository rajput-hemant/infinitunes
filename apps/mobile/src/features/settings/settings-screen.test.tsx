import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { Appearance } from "react-native";
import { toast } from "sonner-native";

import { preferencesStore } from "~/lib/preferences";
import { queryClient } from "~/lib/query-client";
import { renderScreen } from "~/test/render";
import { signInAs, authClient } from "~/test/session-mock";
import { appearanceStore } from "~/theme/appearance";

import { SettingsScreen } from "./settings-screen";

jest.mock("@expo/ui", () => require("~/test/expo-ui"));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

const FAVORITES_KEY = [["user", "getUserFavorites"], { type: "query" }, "u1"];

const initialPreferences = preferencesStore.getState();

// The app's own client schedules cache-collection timers that outlive a test.
afterAll(() => queryClient.clear());

beforeEach(() => {
  preferencesStore.setState(initialPreferences, true);
  appearanceStore.setState({ mode: "system" });
  jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => {});
  queryClient.clear();
});

/** Renders the screen, then stubs navigation (rendering installs the router). */
async function renderSettings() {
  await renderScreen(<SettingsScreen />);
  return jest.spyOn(router, "push").mockImplementation(() => {});
}

describe("SettingsScreen as a guest", () => {
  it("offers to sign in under Account and Security, and nothing destructive", async () => {
    await renderScreen(<SettingsScreen />);

    expect(
      screen.getAllByRole("button", { name: /^Sign in to continue/ }),
    ).toHaveLength(2);
    expect(screen.queryByText("Sign out")).toBeNull();
    expect(screen.queryByText("Delete account")).toBeNull();
    expect(screen.queryByTestId("profile")).toBeNull();
  });

  it("opens the sign-in flow", async () => {
    const push = await renderSettings();

    await fireEvent.press(
      screen.getAllByRole("button", { name: /^Sign in to continue/ })[0],
    );

    expect(push).toHaveBeenCalledWith("/login");
  });

  it("still lets a guest change appearance and playback", async () => {
    await renderScreen(<SettingsScreen />);

    await fireEvent.press(screen.getByRole("menuitem", { name: "Dark" }));

    expect(appearanceStore.getState().mode).toBe("dark");
  });
});

describe("SettingsScreen signed in", () => {
  beforeEach(() => signInAs("u1", { name: "DJ Listener" }));

  it("shows the account and opens its screens", async () => {
    const push = await renderSettings();

    expect(screen.getByText("D")).toBeOnTheScreen();
    expect(screen.getByText("DJ Listener")).toBeOnTheScreen();
    expect(screen.getByText("listener@example.com")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("profile"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Change password" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Delete account" }),
    );

    expect(push).toHaveBeenNthCalledWith(1, "/profile");
    expect(push).toHaveBeenNthCalledWith(2, "/password");
    expect(push).toHaveBeenNthCalledWith(3, "/delete-account");
  });

  it("signs out and forgets the account's cached library", async () => {
    queryClient.setQueryData(FAVORITES_KEY, { song: ["a"] });
    await renderScreen(<SettingsScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
  });

  it("tells the listener when sign-out fails, and keeps the cache", async () => {
    queryClient.setQueryData(FAVORITES_KEY, { song: ["a"] });
    authClient.signOut.mockResolvedValueOnce({ error: { status: 503 } });
    await renderScreen(<SettingsScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
    expect(queryClient.getQueryData(FAVORITES_KEY)).toEqual({ song: ["a"] });
  });
});

describe("SettingsScreen preferences", () => {
  it("applies the chosen theme to the app, and hands back to the system", async () => {
    await renderScreen(<SettingsScreen />);
    expect(screen.getByRole("menuitem", { name: "System" })).toBeSelected();

    await fireEvent.press(screen.getByRole("menuitem", { name: "Dark" }));
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith("dark");
    expect(screen.getByRole("menuitem", { name: "Dark" })).toBeSelected();

    await fireEvent.press(screen.getByRole("menuitem", { name: "System" }));
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith("auto");
  });

  it("saves stream and download quality separately", async () => {
    await renderScreen(<SettingsScreen />);

    const [streamMedium, downloadMedium] = screen.getAllByRole("menuitem", {
      name: "Medium (96kbps)",
    });
    await fireEvent.press(streamMedium);
    expect(preferencesStore.getState()).toMatchObject({
      streamQuality: "medium",
      downloadQuality: "excellent",
    });

    await fireEvent.press(downloadMedium);
    expect(preferencesStore.getState().downloadQuality).toBe("medium");
  });
});

describe("SettingsScreen about", () => {
  it("opens the privacy policy and terms on the web app", async () => {
    await renderScreen(<SettingsScreen />);

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Privacy policy" })),
    );
    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Terms of service" })),
    );

    expect(openBrowserAsync).toHaveBeenNthCalledWith(
      1,
      "https://infinitunes.test/privacy",
    );
    expect(openBrowserAsync).toHaveBeenNthCalledWith(
      2,
      "https://infinitunes.test/terms",
    );
    expect(screen.getByText("Version")).toBeOnTheScreen();
  });
});
