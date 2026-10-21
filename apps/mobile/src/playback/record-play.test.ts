import type { PlayedItem } from "@infinitunes/core/queue-position";

import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { recordPlay } from "./record-play";

const item: PlayedItem = { id: "BSaNI3Yr", type: "song" };

/** Lets the fire-and-forget write's `.catch` run before asserting what it did. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("recordPlay", () => {
  it("sends nothing while signed out", async () => {
    recordPlay(item);
    await flush();

    expect(procedure("history.record")).not.toHaveBeenCalled();
  });

  it("records the start in a signed-in listener's history", async () => {
    signInAs("alice");

    recordPlay(item);
    await flush();

    expect(procedure("history.record")).toHaveBeenCalledWith(item);
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays quiet when the session has expired", async () => {
    signInAs("alice");
    procedure("history.record").mockRejectedValue(trpcError("UNAUTHORIZED"));

    recordPlay(item);
    await flush();

    expect(procedure("history.record")).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("logs any other failure and never throws into playback", async () => {
    signInAs("alice");
    const failure = trpcError("INTERNAL_SERVER_ERROR");
    procedure("history.record").mockRejectedValue(failure);

    expect(() => recordPlay(item)).not.toThrow();
    await flush();

    expect(warn).toHaveBeenCalledWith(
      "history: failed to record play",
      failure,
    );
  });
});
