import { describe, expect, it } from "bun:test";

import {
  isLang,
  parseLanguageCookie,
} from "../../app/(root)/settings/_components/language-options";

describe("language cookie", () => {
  it("keeps the known languages in cookie order", () => {
    expect(parseLanguageCookie("hindi,english")).toEqual(["hindi", "english"]);
  });

  it("drops tokens that are not languages", () => {
    expect(parseLanguageCookie("english,klingon,,tamil")).toEqual([
      "english",
      "tamil",
    ]);
  });

  it("reads a missing cookie as no languages", () => {
    expect(parseLanguageCookie(undefined)).toEqual([]);
  });

  it("recognises only lowercase language ids", () => {
    expect(isLang("hindi")).toBe(true);
    expect(isLang("Hindi")).toBe(false);
  });
});
