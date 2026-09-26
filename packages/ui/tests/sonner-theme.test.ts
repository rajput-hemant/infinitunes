import { describe, expect, it } from "bun:test";

const SONNER_SOURCE = new URL(
  "../src/components/ui/sonner.tsx",
  import.meta.url,
);

describe("sonner theme colors", () => {
  it("wraps HSL theme tokens in hsl() for Sonner", async () => {
    const source = await Bun.file(SONNER_SOURCE).text();

    expect(source).toContain('"--normal-bg": "hsl(var(--popover))"');
    expect(source).toContain(
      '"--normal-text": "hsl(var(--popover-foreground))"',
    );
    expect(source).toContain('"--normal-border": "hsl(var(--border))"');
  });
});
