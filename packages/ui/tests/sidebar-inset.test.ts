import { describe, expect, it } from "bun:test";

const SIDEBAR_SOURCE = new URL(
  "../src/components/ui/sidebar.tsx",
  import.meta.url,
);

describe("sidebar inset layout", () => {
  it("keeps the inset shrinkable inside flex layouts", async () => {
    const source = await Bun.file(SIDEBAR_SOURCE).text();

    expect(source).toContain(
      '"relative flex min-w-0 w-full flex-1 flex-col bg-background',
    );
  });
});
