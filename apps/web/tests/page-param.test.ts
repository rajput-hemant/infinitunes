import { describe, expect, it } from "bun:test";

import { parsePageParam } from "~/lib/page-param";

describe("parsePageParam", () => {
  it("keeps a valid positive page", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("7")).toBe(7);
    expect(parsePageParam("0012")).toBe(12);
  });

  it("falls back to page 1 when the param is missing", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("falls back to page 1 for non-numeric text", () => {
    for (const value of ["abc", "", " ", "2x", "NaN", "Infinity", "1e3"]) {
      expect(parsePageParam(value)).toBe(1);
    }
  });

  it("falls back to page 1 for zero, negative and fractional pages", () => {
    for (const value of ["0", "-1", "-0", "1.5", "+2"]) {
      expect(parsePageParam(value)).toBe(1);
    }
  });

  it("falls back to page 1 for values beyond the safe integer range", () => {
    expect(parsePageParam("9007199254740993")).toBe(1);
  });

  it("reads the first value of a repeated param", () => {
    expect(parsePageParam(["3", "9"])).toBe(3);
    expect(parsePageParam(["abc", "9"])).toBe(1);
    expect(parsePageParam([])).toBe(1);
  });
});
