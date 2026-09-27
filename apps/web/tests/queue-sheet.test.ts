import { describe, expect, it } from "bun:test";

const QUEUE = new URL("../components/queue.tsx", import.meta.url);

describe("queue sheet", () => {
  it("overrides stock sheet sm max width for master parity", async () => {
    const source = await Bun.file(QUEUE).text();

    expect(source).toContain("sm:max-w-xl!");
  });
});
