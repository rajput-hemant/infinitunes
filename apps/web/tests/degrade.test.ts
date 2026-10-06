import { afterAll, beforeEach, describe, expect, spyOn, test } from "bun:test";

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
});
