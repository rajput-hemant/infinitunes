import { AccessibilityInfo } from "react-native";

import { trpcError } from "~/test/trpc-mock";

import {
  dismissFailure,
  FAILURE_MS,
  FAILURE_WITH_ACTION_MS,
  failureStore,
  holdFailure,
  releaseFailure,
  reportFailure,
  showFailure,
} from "./failure";

const current = () => failureStore.getState().current;

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("showFailure", () => {
  it("shows one failure, the newest replacing the last", () => {
    showFailure("First");
    showFailure("Second");
    expect(current()?.message).toBe("Second");
  });

  it("speaks the message to VoiceOver", () => {
    const speak = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibilityWithOptions",
    );
    showFailure("Couldn't play this song");
    expect(speak).toHaveBeenCalledWith("Couldn't play this song", {
      queue: true,
    });
  });

  it("leaves on its own, later when it has an action", () => {
    showFailure("Plain");
    jest.advanceTimersByTime(FAILURE_MS);
    expect(current()).toBeNull();

    showFailure("With action", { label: "Retry", onPress: () => {} });
    jest.advanceTimersByTime(FAILURE_MS);
    expect(current()?.message).toBe("With action");
    jest.advanceTimersByTime(FAILURE_WITH_ACTION_MS - FAILURE_MS);
    expect(current()).toBeNull();
  });

  it("stays while it is held, then counts down again from release", () => {
    showFailure("Dragged");
    const { id } = current()!;
    holdFailure(id);
    jest.advanceTimersByTime(FAILURE_MS * 3);
    expect(current()?.message).toBe("Dragged");

    releaseFailure(id);
    jest.advanceTimersByTime(FAILURE_MS);
    expect(current()).toBeNull();
  });

  it("keeps a newer failure when an older one is dismissed", () => {
    showFailure("Old");
    const old = current()!.id;
    showFailure("New");
    dismissFailure(old);
    expect(current()?.message).toBe("New");
  });
});

describe("reportFailure", () => {
  it("shows a refusal written for the listener", () => {
    reportFailure("Couldn't create the playlist.")(
      trpcError(
        "BAD_REQUEST",
        "You can only have 50 playlists, please delete one",
      ),
    );
    expect(current()?.message).toBe(
      "You can only have 50 playlists, please delete one",
    );
  });

  it("shows the fallback for a server fault", () => {
    reportFailure("Couldn't create the playlist.")(
      trpcError("INTERNAL_SERVER_ERROR", "db exploded"),
    );
    expect(current()?.message).toBe("Couldn't create the playlist.");
  });

  it("never shows a network error's own text", () => {
    reportFailure("Couldn't create the playlist.")(
      new TypeError("Network request failed"),
    );
    expect(current()?.message).toBe("Couldn't create the playlist.");
  });
});
