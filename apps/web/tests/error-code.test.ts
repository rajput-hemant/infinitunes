import { describe, expect, it } from "bun:test";

import { getErrorCode } from "../lib/error-code";

describe("getErrorCode", () => {
  it("reads a top-level code", () => {
    expect(getErrorCode({ code: "NOT_FOUND" })).toBe("NOT_FOUND");
  });

  it("reads the tRPC client error.data.code shape", () => {
    expect(getErrorCode({ data: { code: "BAD_GATEWAY" } })).toBe("BAD_GATEWAY");
  });

  it("returns undefined for anything else", () => {
    expect(getErrorCode(new Error("boom"))).toBeUndefined();
    expect(getErrorCode({ data: { code: 5 } })).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode("NOT_FOUND")).toBeUndefined();
  });
});
