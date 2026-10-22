import { act, fireEvent, screen } from "@testing-library/react-native";
import type { usePanGesture } from "react-native-gesture-handler";

import { failureStore, showFailure } from "~/lib/failure";
import { renderScreen } from "~/test/render";

import { FailureSnackbar } from "./failure-snackbar";

type PanConfig = Parameters<typeof usePanGesture>[0];
const pans: PanConfig[] = [];
const lastPan = () => pans[pans.length - 1]!;
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual("react-native-gesture-handler");
  return {
    ...actual,
    usePanGesture: (config: PanConfig) => {
      pans.push(config);
      return actual.usePanGesture(config);
    },
  };
});

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

  describe("swipe", () => {
    const touch = (
      phase: "onActivate" | "onUpdate" | "onDeactivate",
      event: Record<string, unknown> = {},
    ) =>
      act(async () => {
        (lastPan()[phase] as ((event: unknown) => void) | undefined)?.({
          translationX: 0,
          translationY: 0,
          velocityX: 0,
          velocityY: 0,
          canceled: false,
          ...event,
        });
        // The worklets mock hops back to the JS thread on a timer.
        jest.advanceTimersByTime(50);
      });

    it("runs on the UI thread and keeps the message after a short drag", async () => {
      await renderSnackbar();
      await act(async () => showFailure(MESSAGE));
      await touch("onActivate");
      await touch("onUpdate", { translationX: 10 });
      await touch("onDeactivate", { translationX: 10 });
      expect(failureStore.getState().current?.message).toBe(MESSAGE);
      // Not run on the JS thread: the callbacks are worklets.
      expect(lastPan().runOnJS).toBeUndefined();
    });

    it("dismisses after a drag past the distance", async () => {
      await renderSnackbar();
      await act(async () => showFailure(MESSAGE));
      await touch("onActivate");
      await touch("onDeactivate", { translationX: 80 });
      expect(failureStore.getState().current).toBeNull();
    });

    it("dismisses after a downward flick and ignores a cancelled drag", async () => {
      await renderSnackbar();
      await act(async () => showFailure(MESSAGE));
      await touch("onDeactivate", { translationX: 80, canceled: true });
      expect(failureStore.getState().current).not.toBeNull();

      await touch("onDeactivate", { translationY: 5, velocityY: 900 });
      expect(failureStore.getState().current).toBeNull();
    });
  });
});
