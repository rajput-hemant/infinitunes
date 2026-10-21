import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { recordPlay } from "./record-play";

const play = { id: "BSaNI3Yr", type: "song" } as const;

describe("recordPlay", () => {
  it("records the play for a signed-in listener", async () => {
    signInAs("listener-1");

    await recordPlay(play);

    expect(procedure("history.record")).toHaveBeenCalledWith(play);
  });

  it("sends nothing signed out (the stored cookie is read asynchronously)", async () => {
    signInAs(null);

    await recordPlay(play);

    expect(procedure("history.record")).not.toHaveBeenCalled();
  });

  it("never rejects, and logs only failures other than a lapsed session", async () => {
    signInAs("listener-1");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      procedure("history.record").mockRejectedValueOnce(
        trpcError("UNAUTHORIZED"),
      );
      await expect(recordPlay(play)).resolves.toBeUndefined();
      expect(warn).not.toHaveBeenCalled();

      procedure("history.record").mockRejectedValueOnce(
        trpcError("INTERNAL_SERVER_ERROR"),
      );
      await expect(recordPlay(play)).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });
});
