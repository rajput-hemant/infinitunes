import { describe, expect, test } from "bun:test";

import { childScale, gelScale, pressGrow } from "~/lib/glass/press";

describe("press gel", () => {
  test("growth is capped at 3px of width", () => {
    expect(pressGrow(75)).toBeCloseTo(0.04);
    expect(pressGrow(600)).toBeCloseTo(0.005);
    expect(pressGrow(0)).toBeLessThanOrEqual(0.04);
  });

  test("a child control grows by the cap at full press", () => {
    expect(childScale(0.05, 1)).toBe("1.05");
    expect(childScale(0.05, 0)).toBe("1");
  });

  test("a gel surface grows wider than tall, each capped", () => {
    expect(gelScale(0.08, 1)).toBe("1.03 1.02");
    expect(gelScale(0.02, 1)).toBe("1.02 1.02");
  });
});
