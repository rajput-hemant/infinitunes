import { act, fireEvent, screen } from "@testing-library/react-native";

import { failureStore, showFailure } from "~/lib/failure";
import { renderScreen } from "~/test/render";

import { FailureSnackbar } from "./failure-snackbar";

const MESSAGE = "Couldn't play this song";

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

async function renderSnackbar() {
  await renderScreen(<FailureSnackbar />);
}

describe("FailureSnackbar", () => {
  it("shows nothing until a failure comes in", async () => {
    await renderSnackbar();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("is one alert element named by the message, with a dismiss hint", async () => {
    await renderSnackbar();
    await act(async () => showFailure(MESSAGE));

    const alert = screen.getByRole("alert", { name: MESSAGE });
    expect(alert.props.accessibilityHint).toBe("Dismisses the message");
    expect(alert.props.accessibilityActions).toEqual([
      { name: "activate" },
      { name: "escape", label: "Dismiss" },
    ]);
  });

  it("shows only the newest failure", async () => {
    await renderSnackbar();
    await act(async () => showFailure("First"));
    await act(async () => showFailure("Second"));

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert", { name: "Second" })).toBeOnTheScreen();
  });

  it("goes away on a tap and on a screen reader's escape", async () => {
    await renderSnackbar();
    await act(async () => showFailure(MESSAGE));
    await fireEvent.press(screen.getByRole("alert"));
    expect(failureStore.getState().current).toBeNull();

    await act(async () => showFailure(MESSAGE));
    await act(async () =>
      screen.getByRole("alert").props.onAccessibilityEscape(),
    );
    expect(failureStore.getState().current).toBeNull();
  });

  it("runs its action from a tap or the screen reader's actions", async () => {
    const retry = jest.fn();
    await renderSnackbar();
    await act(async () =>
      showFailure(MESSAGE, { label: "Retry", onPress: retry }),
    );
    expect(screen.getByRole("alert").props.accessibilityActions).toContainEqual(
      { name: "action", label: "Retry" },
    );

    await fireEvent.press(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(failureStore.getState().current).toBeNull();

    await act(async () =>
      showFailure(MESSAGE, { label: "Retry", onPress: retry }),
    );
    await act(async () =>
      screen
        .getByRole("alert")
        .props.onAccessibilityAction({ nativeEvent: { actionName: "action" } }),
    );
    expect(retry).toHaveBeenCalledTimes(2);
  });
});
