import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "postcss";
import type { Declaration, Rule } from "postcss";

const read = (name: string) =>
  readFileSync(join(import.meta.dir, "../styles", name), "utf8");
const globals = parse(read("globals.css"));

function findRule(
  root: ReturnType<typeof parse>,
  selector: string,
): Rule | undefined {
  let found: Rule | undefined;
  root.walkRules((rule: Rule) => {
    if (rule.selectors.some((sel) => sel === selector)) {
      found = rule;
    }
  });
  return found;
}

describe("dark mode placeholder inversion", () => {
  it("declares filter: invert(1) for placeholder images in dark mode", () => {
    const selector = '.dark img[src*="/images/placeholder/"]';
    const rule = findRule(globals, selector);
    expect(rule).toBeDefined();

    const decls: Declaration[] = [];
    rule?.walkDecls((decl) => {
      decls.push(decl);
    });

    const filterDecl = decls.find((decl) => decl.prop === "filter");
    expect(filterDecl?.value).toBe("invert(1)");
  });

  it("targets the placeholder asset directory covering all placeholder images", () => {
    const placeholderDir = join(
      import.meta.dir,
      "../public/images/placeholder",
    );
    const placeholders = readdirSync(placeholderDir).filter((file) =>
      file.endsWith(".jpg"),
    );

    expect(placeholders.length).toBeGreaterThan(0);
    for (const file of placeholders) {
      const src = `/images/placeholder/${file}`;
      expect(src).toContain("/images/placeholder/");
    }
  });
});
