import { describe, expect, it } from "bun:test";

const GLOBALS = new URL("../styles/globals.css", import.meta.url);
const FIXTURE = new URL(
  "./fixtures/shadcn-init-neutral-variables.css",
  import.meta.url,
);

function extractShadcnVariableBlocks(source: string) {
  const themeStart = source.indexOf("@theme inline {");
  const rootStart = source.indexOf(":root {");
  const darkStart = source.indexOf(".dark {");
  if (themeStart === -1 || rootStart === -1 || darkStart === -1) {
    throw new Error("missing shadcn variable blocks in globals.css");
  }

  function sliceBlock(start: number, open: string) {
    const from = source.indexOf(open, start);
    const brace = source.indexOf("{", from);
    let depth = 0;
    for (let i = brace; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}") {
        depth--;
        if (!depth) return source.slice(from, i + 1);
      }
    }
    throw new Error(`unclosed block at ${start}`);
  }

  const themeBlock = sliceBlock(themeStart, "@theme inline");
  const rootBlock = sliceBlock(rootStart, ":root");
  const darkBlock = sliceBlock(darkStart, ".dark");

  return normalizeCss(`${themeBlock}\n\n${rootBlock}\n\n${darkBlock}`);
}

function normalizeCss(css: string) {
  return css
    .replace(/\s+/g, " ")
    .replace(/;\s*/g, ";\n")
    .replace(/\{\s*/g, "{\n")
    .replace(/\s*\}/g, "\n}\n")
    .trim();
}

function tokenNames(block: string) {
  return new Set([...block.matchAll(/--([\w-]+):/g)].map(([, name]) => name));
}

describe("shadcn css variables", () => {
  it("keeps the shadcn @theme mapping and defines every shadcn token in :root and .dark", async () => {
    const globals = await Bun.file(GLOBALS).text();
    const fixture = await Bun.file(FIXTURE).text();

    const globalsLines = extractShadcnVariableBlocks(globals)
      .split("\n")
      .map((line) => line.trim());
    const fixtureBlocks = extractShadcnVariableBlocks(fixture);

    // The @theme color/radius mapping is structural and must match shadcn init.
    for (const line of fixtureBlocks.split("\n")) {
      const trimmed = line.trim();
      if (/^--(color|radius)-[\w-]+:/.test(trimmed)) {
        expect(globalsLines).toContain(trimmed);
      }
    }

    // Palette values are app-owned; only the token names are contractual.
    const fixtureRoot = tokenNames(
      fixture.slice(fixture.indexOf(":root"), fixture.indexOf(".dark")),
    );
    const fixtureDark = tokenNames(fixture.slice(fixture.indexOf(".dark")));
    const root = tokenNames(globals.slice(globals.indexOf(":root {")));
    const dark = tokenNames(
      globals.slice(globals.indexOf(".dark {"), globals.indexOf("@layer base")),
    );
    for (const name of fixtureRoot) expect(root.has(name)).toBe(true);
    for (const name of fixtureDark) expect(dark.has(name)).toBe(true);
  });

  it("does not use hsl(var(--token)) shadcn variable wrapping", async () => {
    const globals = await Bun.file(GLOBALS).text();
    expect(globals).not.toMatch(/hsl\(var\(--/);
  });
});
