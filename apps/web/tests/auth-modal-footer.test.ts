import { describe, expect, it } from "bun:test";

const AUTH_MODAL = new URL("../app/@modal/auth-modal.tsx", import.meta.url);

describe("auth modal footer", () => {
  it("labels the dismiss control Close like master", async () => {
    const source = await Bun.file(AUTH_MODAL).text();

    expect(source).toContain("Close");
    expect(source).not.toMatch(/>\s*Back\s*</);
  });
});
