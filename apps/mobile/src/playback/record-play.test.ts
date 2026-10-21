import type { PlayedItem } from "@infinitunes/core/queue-position";

import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { recordPlay } from "./record-play";

const item: PlayedItem = { id: "BSaNI3Yr", type: "song" };

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("recordPlay", () => {
  it("records the start in a signed-in listener's history", async () => {
    signInAs("alice");

    await recordPlay(item);

    expect(procedure("history.record")).toHaveBeenCalledWith(item);
    expect(warn).not.toHaveBeenCalled();
  });

  it("sends nothing signed out (the stored cookie is read asynchronously)", async () => {
    signInAs(null);

    await recordPlay(item);

    expect(procedure("history.record")).not.toHaveBeenCalled();
  });

  it("stays quiet when the session has expired", async () => {
    signInAs("alice");
    procedure("history.record").mockRejectedValue(trpcError("UNAUTHORIZED"));

    await expect(recordPlay(item)).resolves.toBeUndefined();

    expect(procedure("history.record")).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("logs any other failure and never rejects into playback", async () => {
    signInAs("alice");
    const failure = trpcError("INTERNAL_SERVER_ERROR");
    procedure("history.record").mockRejectedValue(failure);

    await expect(recordPlay(item)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      "history: failed to record play",
      failure,
    );
  });
});
