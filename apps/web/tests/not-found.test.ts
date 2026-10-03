import { describe, expect, test } from "bun:test";

import { TRPCError } from "@trpc/server";

import { isNotFoundError, orNotFound } from "~/lib/not-found";

describe("orNotFound", () => {
  test("passes a resolved value through", async () => {
    expect(await orNotFound(Promise.resolve(7))).toBe(7);
  });

  test("turns NOT_FOUND into Next's not-found signal", async () => {
    const failure = orNotFound(
      Promise.reject(new TRPCError({ code: "NOT_FOUND" })),
    );
    await expect(failure).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  test("rethrows other failures untouched", async () => {
    const upstream = new TRPCError({ code: "BAD_GATEWAY" });
    await expect(orNotFound(Promise.reject(upstream))).rejects.toBe(upstream);
  });

  test("isNotFoundError ignores non-objects", () => {
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError("NOT_FOUND")).toBe(false);
  });
});
