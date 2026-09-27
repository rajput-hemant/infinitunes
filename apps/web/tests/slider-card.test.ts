import { describe, expect, it } from "bun:test";

const SLIDER_CARD = new URL("../components/slider/slider-card.tsx", import.meta.url);

describe("slider card", () => {
  it("strips stock card ring and vertical padding at the call site", async () => {
    const source = await Bun.file(SLIDER_CARD).text();

    expect(source).toContain("ring-0");
    expect(source).toContain("py-0");
    expect(source).toContain("gap-0");
  });
});
