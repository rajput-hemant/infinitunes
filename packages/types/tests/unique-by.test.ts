import { describe, expect, it } from "bun:test";

import { uniqueBy } from "../src/misc";

describe("uniqueBy", () => {
  it("keeps the first item for a repeated key and the original order", () => {
    const items = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
      { id: "a", n: 3 },
      { id: "c", n: 4 },
      { id: "b", n: 5 },
    ];
    expect(uniqueBy(items, (item) => item.id)).toEqual([
      { id: "a", n: 1 },
      { id: "b", n: 2 },
      { id: "c", n: 4 },
    ]);
  });

  it("merges pages without repeating an id that straddles a page boundary", () => {
    const pages = [
      ["1", "2", "3"],
      ["3", "4"],
      ["4", "5"],
    ];
    expect(uniqueBy(pages.flat(), (id) => id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("keeps items that have no key", () => {
    const items = [{ id: "" }, { id: "" }, { id: undefined }, { id: "x" }];
    expect(uniqueBy(items, (item) => item.id)).toHaveLength(4);
  });

  it("does not mutate the input", () => {
    const items = ["a", "a"];
    uniqueBy(items, (item) => item);
    expect(items).toEqual(["a", "a"]);
  });
});
