import { describe, expect, it } from "bun:test";

import { isLang, parseLanguages } from "../src/misc";

describe("parseLanguages", () => {
  it("keeps the known languages in list order", () => {
    expect(parseLanguages("hindi,english")).toEqual(["hindi", "english"]);
  });

  it("drops tokens that are not languages", () => {
    expect(parseLanguages("english,klingon,,tamil")).toEqual([
      "english",
      "tamil",
    ]);
  });

  it("reads a missing list as no languages", () => {
    expect(parseLanguages(undefined)).toEqual([]);
  });
});

describe("isLang", () => {
  it("recognises only lowercase language ids", () => {
    expect(isLang("hindi")).toBe(true);
    expect(isLang("Hindi")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
