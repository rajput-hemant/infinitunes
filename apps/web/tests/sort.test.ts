import { expect, test } from "bun:test";

import { readSort } from "../lib/sort";

test("readSort keeps asc and defaults everything else to desc", () => {
  expect(readSort("asc")).toBe("asc");
  expect(readSort("desc")).toBe("desc");
  expect(readSort(undefined)).toBe("desc");
  expect(readSort("ASC")).toBe("desc");
  expect(readSort(["asc", "desc"])).toBe("desc");
});
