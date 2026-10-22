import { act } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderRouter } from "expo-router/testing-library";

import { signInAs } from "~/test/session-mock";

import { closeAuth } from "./auth-header";

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

  it("closes back to the screen it was opened from", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/search" });

    await act(async () => router.push("/login"));
    expect(app.getByRole("button", { name: "Close" })).toBeTruthy();
    await act(async () => router.push("/signup"));
    expect(app.queryByRole("button", { name: "Close" })).toBeNull();
    await act(async () => router.back());

    await act(async () => closeAuth());
    expect(app.getSegments()).toEqual(["(tabs)", "(search)", "search"]);
  });

  it("closes a sign-in link opened cold to Home", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/login" });

    await act(async () => closeAuth());
    expect(app.getSegments()).toEqual(["(tabs)", "(home)"]);
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

  it("treats a reset link that repeats its token as invalid", async () => {
    const app = await renderRouter("./src/app", {
      initialUrl: "/reset-password?token=a&token=b",
    });

    expect(app.getByText(/reset link is invalid/)).toBeTruthy();
  });

  it("returns to the settings list when the account goes away", async () => {
    signInAs("user-1");
    const app = await renderRouter("./src/app", { initialUrl: "/settings" });

    await act(async () => router.push("/delete-account"));
    expect(app.getPathname()).toBe("/delete-account");

    await act(async () => signInAs(null));
    expect(app.getPathname()).toBe("/settings");

    // Settings is pushed onto a tab (Home, for a link): nothing of the deleted account's is left
    // between it and the tab's root.
    expect(activeStackRoutes(app.getRouterState())).toEqual([
      "index",
      "settings",
    ]);
  });
});
