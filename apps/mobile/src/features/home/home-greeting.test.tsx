import { renderHook } from "@testing-library/react-native";

import { signInAs } from "~/test/session-mock";

import { useHomeGreeting } from "./home-header";

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
