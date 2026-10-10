import { describe, expect, it } from "bun:test";

const BROWSE = new URL("../app/(root)/browse/page.tsx", import.meta.url);
const TERMS = new URL("../app/(root)/terms/page.tsx", import.meta.url);
const PRIVACY = new URL("../app/(root)/privacy/page.tsx", import.meta.url);

describe("linked routes", () => {
  it("/browse redirects to the home page", async () => {
    const source = await Bun.file(BROWSE).text();
    expect(source).toContain('redirect("/")');
  });

  it("/terms is a draft placeholder page with metadata", async () => {
    const source = await Bun.file(TERMS).text();
    expect(source).toContain('url: "/terms"');
    expect(source).toContain("<h1");
    expect(source).toContain("Draft placeholder");
  });

  it("/privacy is a draft placeholder page with metadata", async () => {
    const source = await Bun.file(PRIVACY).text();
    expect(source).toContain('url: "/privacy"');
    expect(source).toContain("<h1");
    expect(source).toContain("Draft placeholder");
  });
});
