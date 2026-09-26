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

describe("shadcn neutral css variables", () => {
  it("matches shadcn init output for @theme mapping and :root/.dark tokens", async () => {
    const globals = await Bun.file(GLOBALS).text();
    const fixture = await Bun.file(FIXTURE).text();

    const fromGlobals = extractShadcnVariableBlocks(globals);
    const expected = normalizeCss(fixture);

    const globalsLines = fromGlobals
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("--font-"));
    const fixtureLines = expected
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of fixtureLines) {
      expect(globalsLines).toContain(line);
    }
  });

  it("does not use hsl(var(--token)) shadcn variable wrapping", async () => {
    const globals = await Bun.file(GLOBALS).text();
    expect(globals).not.toMatch(/hsl\(var\(--/);
  });
});
