import { act, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Text } from "react-native";

import { renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";

import { RequireSession } from "./require-session";

function SettingsList() {
  return <Text>Settings list</Text>;
}

function renderGuarded() {
  return renderScreen(
    <RequireSession>
      {(user) => <Text>Hello {user.email}</Text>}
    </RequireSession>,
    { routes: { settings: SettingsList } },
  );
}

afterEach(() => jest.restoreAllMocks());

describe("RequireSession", () => {
  it("passes the signed-in user to its children", async () => {
    signInAs("u1", { email: "dj@example.com" });
    const dismissTo = jest.spyOn(router, "dismissTo");

    await renderGuarded();

    expect(screen.getByText("Hello dj@example.com")).toBeOnTheScreen();
    expect(dismissTo).not.toHaveBeenCalled();
  });

  it("redirects a link that opens the screen as a guest to the settings list", async () => {
    await renderGuarded();

    expect(await screen.findByText("Settings list")).toBeOnTheScreen();
    expect(screen.queryByText(/^Hello/)).toBeNull();
  });

  it("pops back to the settings list when the account goes away while open", async () => {
    signInAs("u1");
    await renderGuarded();
    const dismissTo = jest
      .spyOn(router, "dismissTo")
      .mockImplementation(() => {});
    expect(screen.getByText(/^Hello/)).toBeOnTheScreen();

    await act(async () => signInAs(null));

    expect(dismissTo).toHaveBeenCalledTimes(1);
    expect(dismissTo).toHaveBeenCalledWith("/settings");
    expect(screen.queryByText(/^Hello/)).toBeNull();
  });
});
