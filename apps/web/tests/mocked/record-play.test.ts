import { describe, expect, it, mock, spyOn } from "bun:test";

mock.module("server-only", () => ({}));

let record: (item: unknown) => Promise<unknown> = async () => ({ ok: true });
const calls: unknown[] = [];

mock.module("~/lib/trpc/server", () => ({
  api: {
    history: {
      record: (item: unknown) => {
        calls.push(item);
        return record(item);
      },
    },
  },
}));

const { recordPlay } = await import("../../lib/history-actions");

describe("recordPlay history wrapper", () => {
  it("records the played item", async () => {
    calls.length = 0;
    record = async () => ({ ok: true });
    await expect(
      recordPlay({ id: "song-1", type: "song" }),
    ).resolves.toBeUndefined();
    expect(calls).toEqual([{ id: "song-1", type: "song" }]);
  });

  it("silently no-ops for logged-out users", async () => {
    record = async () => {
      throw Object.assign(new Error("Unauthorized"), { code: "UNAUTHORIZED" });
    };
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        recordPlay({ id: "song-1", type: "song" }),
      ).resolves.toBeUndefined();
      expect(err).not.toHaveBeenCalled();
    } finally {
      err.mockRestore();
    }
  });

  it("swallows and logs other failures", async () => {
    record = async () => {
      throw new Error("db down");
    };
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        recordPlay({ id: "ep-1", type: "episode" }),
      ).resolves.toBeUndefined();
      expect(err).toHaveBeenCalled();
    } finally {
      err.mockRestore();
    }
  });
});
