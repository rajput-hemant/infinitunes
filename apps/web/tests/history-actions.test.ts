import { describe, expect, it, mock } from "bun:test";

import { TRPCError } from "@trpc/server";

mock.module("server-only", () => ({}));

let failure: unknown;
let calls = 0;
mock.module("../lib/trpc/server", () => ({
  api: {
    history: {
      record: async () => {
        calls += 1;
        if (failure) throw failure;
      },
    },
  },
}));

const { recordPlay } = await import("../lib/history-actions");

describe("recordPlay", () => {
  it("stays silent for logged-out users and logs other failures", async () => {
    const errors: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      failure = new TRPCError({ code: "UNAUTHORIZED" });
      await recordPlay({ id: "s1", type: "song" });
      expect(errors).toHaveLength(0);

      failure = new Error("db down");
      await recordPlay({ id: "s1", type: "song" });
      expect(errors).toHaveLength(1);
      expect(calls).toBe(2);
    } finally {
      console.error = original;
    }
  });
});
