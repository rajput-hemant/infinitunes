import { describe, expect, it } from "bun:test";

const AUTH_MODAL = new URL("../app/@modal/auth-modal.tsx", import.meta.url);

describe("auth modal close control", () => {
  it("relies on the built-in labelled X and has no duplicate footer Close", async () => {
    const source = await Bun.file(AUTH_MODAL).text();

    expect(source).not.toContain("showCloseButton={false}");
    expect(source).not.toContain("DialogFooter");
    expect(source).not.toContain("DialogClose");
    expect(source).not.toMatch(/>\s*(Close|Back)\s*</);
  });
});
