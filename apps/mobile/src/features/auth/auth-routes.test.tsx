import { act } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderRouter } from "expo-router/testing-library";

import { signInAs } from "~/test/session-mock";

type NavigatorState = {
  index?: number;
  routes: { name: string; state?: NavigatorState }[];
};

/** The route names of the innermost navigator on screen. */
function activeStackRoutes(state: NavigatorState | undefined): string[] {
  if (!state) return [];
  const active = state.routes[state.index ?? 0];
  return active?.state
    ? activeStackRoutes(active.state)
    : state.routes.map((route) => route.name);
}

describe("sign-in flow in the app's route tree", () => {
  it("returns to the screen it was opened from once signed in", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/search" });

    await act(async () => router.push("/login"));
    expect(app.getPathname()).toBe("/login");

    await act(async () => signInAs("user-1"));

    expect(app.getSegments()).toEqual(["(tabs)", "(search)", "search"]);
  });

  it("sends a signed-in listener who opens a sign-in link to Home", async () => {
    signInAs("user-1");

    const app = await renderRouter("./src/app", { initialUrl: "/login" });

    expect(app.getSegments()).toEqual(["(tabs)", "(home)"]);
  });

  it("sends a guest who opens an account screen to the settings list", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/profile" });

    expect(app.getPathname()).toBe("/settings");
  });

  it("returns to the settings list when the account goes away", async () => {
    signInAs("user-1");
    const app = await renderRouter("./src/app", { initialUrl: "/settings" });

    await act(async () => router.push("/delete-account"));
    expect(app.getPathname()).toBe("/delete-account");

    await act(async () => signInAs(null));
    expect(app.getPathname()).toBe("/settings");

    // Settings is the stack's only screen: nothing of the deleted account's is left behind it.
    expect(activeStackRoutes(app.getRouterState())).toEqual(["settings"]);
  });
});
