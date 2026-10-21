import { act, screen } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";

import AuthLayout from "~/app/(auth)/_layout";

import { signInAs } from "./auth-client-mock";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);

const tree = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: () => <Text>Home</Text>,
  "(auth)/_layout": AuthLayout,
  "(auth)/login": () => <Text>Login screen</Text>,
};

beforeEach(() => signInAs(null));

describe("(auth) layout", () => {
  it("shows the sign-in screens to a guest", async () => {
    const app = await renderRouter(tree, { initialUrl: "/login" });

    expect(app.getPathname()).toBe("/login");
    expect(screen.getByText("Login screen")).toBeOnTheScreen();
  });

  it("sends a signed-in listener home, as the web's proxy does", async () => {
    signInAs("user-1");
    const app = await renderRouter(tree, { initialUrl: "/login" });

    expect(app.getPathname()).toBe("/");
    expect(screen.getByText("Home")).toBeOnTheScreen();
  });

  it("leaves the flow as soon as a sign-in succeeds", async () => {
    const app = await renderRouter(tree, { initialUrl: "/login" });

    await act(async () => signInAs("user-1"));

    expect(app.getPathname()).toBe("/");
    expect(screen.queryByText("Login screen")).toBeNull();
  });
});
