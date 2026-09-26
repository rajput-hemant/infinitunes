import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT_SOURCE = new URL("../app/(root)/layout.tsx", import.meta.url);

describe("sidebar inset layout", () => {
  it("keeps the inset shrinkable inside flex layouts at the call site", async () => {
    const source = await Bun.file(ROOT_LAYOUT_SOURCE).text();

    expect(source).toContain('<SidebarInset className="min-w-0">');
  });
});
