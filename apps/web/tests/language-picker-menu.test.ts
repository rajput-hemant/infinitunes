import { describe, expect, it } from "bun:test";

const LANGUAGE_PICKER = new URL(
  "../components/site-header/language-picker.tsx",
  import.meta.url,
);

describe("language picker menu", () => {
  it("sizes the dropdown wider than the anchor trigger", async () => {
    const source = await Bun.file(LANGUAGE_PICKER).text();

    expect(source).toContain('className="w-auto min-w-[18.5625rem]"');
    expect(source).toContain("h-10 min-w-[4.4375rem]");
  });

  it("stretches the language toggle grid to fill the menu", async () => {
    const source = await Bun.file(LANGUAGE_PICKER).text();

    expect(source).toContain("grid w-full grid-cols-2");
  });
});
