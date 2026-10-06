import { describe, expect, it } from "bun:test";

import { formatCount, formatReleaseDate } from "../src/media";

describe("formatCount", () => {
  it("formats compact numbers with en-US locale", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1)).toBe("1");
    expect(formatCount(1234)).toBe("1.2K");
    expect(formatCount(1_284_000)).toBe("1.3M");
  });

  it("coerces strings to numbers", () => {
    expect(formatCount("1284000")).toBe("1.3M");
    expect(formatCount("42")).toBe("42");
  });

  it("returns 0 for undefined, null, or non-numeric input", () => {
    expect(formatCount(undefined)).toBe("0");
    expect(formatCount(null)).toBe("0");
    expect(formatCount("not-a-number")).toBe("0");
  });

  it("treats negative values as 0", () => {
    expect(formatCount(-5)).toBe("0");
    expect(formatCount("-10")).toBe("0");
  });
});

describe("formatReleaseDate", () => {
  it("returns a formatted date for valid ISO strings", () => {
    expect(formatReleaseDate("2024-03-15")).toBe("Mar 15, 2024");
    expect(formatReleaseDate("1999-12-31")).toBe("Dec 31, 1999");
  });

  it("returns an empty string for undefined or null", () => {
    expect(formatReleaseDate(undefined)).toBe("");
    expect(formatReleaseDate(null)).toBe("");
  });

  it("returns an empty string for non-date strings", () => {
    expect(formatReleaseDate("not-a-date")).toBe("");
    expect(formatReleaseDate("")).toBe("");
    expect(formatReleaseDate("2024-13-45")).toBe("");
  });
});
