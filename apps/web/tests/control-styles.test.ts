import { describe, expect, it } from "bun:test";

import { controlStyles } from "../lib/control-styles";

describe("controlStyles", () => {
  it("defines every control role with a non-empty class string", () => {
    for (const key of [
      "text",
      "headerIcon",
      "rowIcon",
      "hero",
      "heroIcon",
      "transport",
      "transportPlay",
    ] as const) {
      expect(typeof controlStyles[key]).toBe("string");
      expect(controlStyles[key].length).toBeGreaterThan(0);
    }
  });
});
