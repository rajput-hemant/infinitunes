import { describe, expect, it } from "bun:test";

const APP_TOASTER_SOURCE = new URL(
  "../components/app-toaster.tsx",
  import.meta.url,
);

describe("app toaster theme colors", () => {
  it("wraps HSL theme tokens in hsl() for Sonner", async () => {
    const source = await Bun.file(APP_TOASTER_SOURCE).text();

    expect(source).toContain('"--normal-bg": "hsl(var(--popover))"');
    expect(source).toContain(
      '"--normal-text": "hsl(var(--popover-foreground))"',
    );
    expect(source).toContain('"--normal-border": "hsl(var(--border))"');
  });
});
