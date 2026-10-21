import type { focusManager as FocusManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";

import { queryClient, shouldRetry } from "./query-client";

describe("the app's query client", () => {
  it("retries by the app's rules and keeps catalog data fresh for five minutes", () => {
    const { queries } = queryClient.getDefaultOptions();

    expect(queries?.retry).toBe(shouldRetry);
    expect(queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it("reports the app going to the background and coming back as focus", () => {
    let report: (state: AppStateStatus) => void = () => {};
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, cb) => {
      report = cb;
      return { remove: jest.fn() };
    });

    // The module wires the managers as it loads, so load a fresh copy of it
    // (and of the query library it configures) with the listener spied on.
    let focus: typeof FocusManager | undefined;
    jest.isolateModules(() => {
      focus = require("@tanstack/react-query").focusManager;
      require("./query-client");
    });

    report("background");
    expect(focus?.isFocused()).toBe(false);
    report("active");
    expect(focus?.isFocused()).toBe(true);
  });
});
