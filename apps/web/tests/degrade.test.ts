import { afterAll, beforeEach, describe, expect, spyOn, test } from "bun:test";

import { notFound, redirect } from "next/navigation";

import { orFallback } from "~/lib/degrade";

const errorLog = spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => errorLog.mockClear());
afterAll(() => errorLog.mockRestore());

describe("orFallback", () => {
  test("passes a resolved value through without logging", async () => {
    expect(await orFallback("x", Promise.resolve([1]), [])).toEqual([1]);
    expect(errorLog).not.toHaveBeenCalled();
  });

  test("returns the fallback and logs when the request fails", async () => {
    const result = await orFallback(
      "recommendations",
      Promise.reject(new Error("upstream down")),
      undefined,
    );

    expect(result).toBeUndefined();
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog.mock.calls[0]?.[0]).toContain("recommendations");
  });

  test("falls back quietly for a NOT_FOUND-coded error", async () => {
    const error = Object.assign(new Error("no lyrics"), { code: "NOT_FOUND" });

    expect(await orFallback("lyrics", Promise.reject(error), null)).toBeNull();
    expect(errorLog).not.toHaveBeenCalled();
  });

  test("tags the log with the given scope", async () => {
    await orFallback("footer", Promise.reject(new Error("x")), [], "shell");

    expect(errorLog.mock.calls[0]?.[0]).toContain("[shell] footer");
  });

  test("rethrows redirect() and notFound() instead of degrading", async () => {
    const redirected = Promise.resolve().then(() => redirect("/login"));
    await expect(orFallback("x", redirected, null)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    const missing = Promise.resolve().then(() => notFound());
    await expect(orFallback("x", missing, null)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK"),
    });

    expect(errorLog).not.toHaveBeenCalled();
  });
});
