import { describe, expect, test } from "bun:test";

import { inkOverflowOrigin } from "~/lib/glass/shadow-overflow";

describe("inkOverflowOrigin", () => {
  test("is zero without an outer shadow", () => {
    expect(inkOverflowOrigin("none")).toEqual({ x: 0, y: 0 });
    expect(
      inkOverflowOrigin("rgba(255, 255, 255, 0.5) inset 0px 1px 1px 0px"),
    ).toEqual({ x: 0, y: 0 });
  });

  test("reaches 1.5 blur plus spread past the left, less the offset on top", () => {
    expect(
      inkOverflowOrigin("rgba(0, 0, 0, 0.34) 0px 30px 70px -18px"),
    ).toEqual({ x: 87, y: 57 });
  });

  test("a shadow thrown away from an edge does not reach past it", () => {
    expect(inkOverflowOrigin("rgb(0 0 0) 20px 40px 0px 0px")).toEqual({
      x: 0,
      y: 0,
    });
  });

  test("takes the widest reach across a list, commas in colors included", () => {
    expect(
      inkOverflowOrigin(
        "rgba(0, 0, 0, 0.05) 0px 0px 0px 0.5px, rgba(0, 0, 0, 0.08) 0px 4px 12px 0px, rgba(0, 0, 0, 0.34) 0px 30px 70px -18px",
      ),
    ).toEqual({ x: 87, y: 57 });
  });

  test("is capped by the distance to the viewport's left and top edges", () => {
    const shadow = "rgba(0, 0, 0, 0.34) 0px 30px 70px -18px";
    expect(inkOverflowOrigin(shadow, { x: 1023, y: 48 })).toEqual({
      x: 87,
      y: 48,
    });
    expect(inkOverflowOrigin(shadow, { x: 20, y: 400 })).toEqual({
      x: 20,
      y: 57,
    });
  });

  test("never goes negative for a surface scrolled past the viewport edge", () => {
    expect(
      inkOverflowOrigin("rgba(0, 0, 0, 0.34) 0px 30px 70px -18px", {
        x: -40,
        y: -12,
      }),
    ).toEqual({ x: 0, y: 0 });
  });
});
