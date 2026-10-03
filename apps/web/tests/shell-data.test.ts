import { afterAll, beforeEach, describe, expect, spyOn, test } from "bun:test";

import {
  EMPTY_FOOTER,
  EMPTY_MEGA_MENU,
  footerOrEmpty,
  megaMenuOrEmpty,
} from "~/lib/shell-data";

const errorLog = spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => errorLog.mockClear());
afterAll(() => errorLog.mockRestore());

describe("megaMenuOrEmpty", () => {
  test("passes upstream data through", async () => {
    const data = { mega_menu: { ...EMPTY_MEGA_MENU.mega_menu } };

    expect(await megaMenuOrEmpty(Promise.resolve(data))).toBe(data);
    expect(errorLog).not.toHaveBeenCalled();
  });

  test("falls back to an empty menu and logs when upstream fails", async () => {
    const result = await megaMenuOrEmpty(
      Promise.reject(new Error("upstream down")),
    );

    expect(result).toEqual(EMPTY_MEGA_MENU);
    expect(errorLog).toHaveBeenCalledTimes(1);
  });
});

describe("footerOrEmpty", () => {
  test("passes upstream data through", async () => {
    const data = { ...EMPTY_FOOTER, artist: [] };

    expect(await footerOrEmpty(Promise.resolve(data))).toBe(data);
  });

  test("falls back to empty link groups and logs when upstream fails", async () => {
    const result = await footerOrEmpty(
      Promise.reject(new Error("upstream down")),
    );

    expect(result).toEqual(EMPTY_FOOTER);
    expect(errorLog).toHaveBeenCalledTimes(1);
  });
});
