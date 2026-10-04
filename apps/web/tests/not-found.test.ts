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

  test("turns a nested NOT_FOUND code into Next's not-found signal", async () => {
    await expect(
      orNotFound(Promise.reject({ data: { code: "NOT_FOUND" } })),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  test("ignores malformed nested data", () => {
    for (const data of [null, "NOT_FOUND", 404, {}, { code: 404 }]) {
      expect(isNotFoundError({ data })).toBe(false);
    }
  });

  test("prefers any direct string code over the nested code", () => {
    expect(
      isNotFoundError({ code: "UNKNOWN_CODE", data: { code: "NOT_FOUND" } }),
    ).toBe(false);
    expect(
      isNotFoundError({ code: "NOT_FOUND", data: { code: "BAD_GATEWAY" } }),
    ).toBe(true);
  });

  test("isNotFoundError ignores non-objects", () => {
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError("NOT_FOUND")).toBe(false);
  });
});
