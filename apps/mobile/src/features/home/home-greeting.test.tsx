import { renderHook, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { useTopLevelHeaderOptions } from "~/navigation/top-level-actions";
import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";

import { useHomeGreeting } from "./home-header";
import { HomeTitle } from "./home-title";

describe("useHomeGreeting", () => {
  it("is the time of day alone while signed out", async () => {
    const { result } = await renderHook(() => useHomeGreeting());
    expect(result.current).toMatch(/^Good (morning|afternoon|evening)$/);
  });

  it("adds the listener's first name once signed in", async () => {
    signInAs("u1", { name: "Asha Rao" });
    const { result } = await renderHook(() => useHomeGreeting());
    expect(result.current).toMatch(/^Good (morning|afternoon|evening), Asha$/);
  });
});

describe("Home's title", () => {
  afterEach(() => jest.restoreAllMocks());

  it("is a header in Android's page, with an empty bar title", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    signInAs("u1", { name: "Asha Rao" });
    await renderWithProviders(<HomeTitle />);
    expect(
      screen.getByRole("header", {
        name: /^Good (morning|afternoon|evening), Asha$/,
      }),
    ).toBeOnTheScreen();

    const { result } = await renderHook(() =>
      useTopLevelHeaderOptions("Good morning, Asha", { titleInPage: true }),
    );
    expect(result.current.headerTitle).toBe("");
    expect(result.current.title).toBe("Good morning, Asha");
  });

  it("stays in iOS's bar", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await renderWithProviders(<HomeTitle />);
    expect(screen.queryByRole("header")).toBeNull();
  });
});
