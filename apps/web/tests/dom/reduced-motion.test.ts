import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "postcss";
import type { AtRule, Declaration, Rule } from "postcss";

const read = (name: string) =>
  readFileSync(join(import.meta.dir, "../../styles", name), "utf8");
const globals = parse(read("globals.css"));
const motion = parse(read("motion.css"));

const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

/** Declarations of every rule whose selector starts with `selector`, inside the reduced media query or not. */
function declarations(
  root: ReturnType<typeof parse>,
  selector: string,
  inReducedMedia: boolean,
): Declaration[] {
  const found: Declaration[] = [];
  root.walkRules((rule: Rule) => {
    const parent = rule.parent;
    const inMedia =
      parent?.type === "atrule" &&
      (parent as AtRule).name === "media" &&
      (parent as AtRule).params === REDUCED_MEDIA;
    if (inMedia !== inReducedMedia) return;
    if (!rule.selectors.some((sel) => sel === selector)) return;
    rule.walkDecls((decl) => {
      found.push(decl);
    });
  });
  return found;
}

const value = (decls: Declaration[], prop: string) =>
  decls.findLast((decl) => decl.prop === prop)?.value;

const toMs = (css: string | undefined) => {
  if (!css) return Number.NaN;
  const match = /^([\d.]+)(ms|s)$/.exec(css.trim());
  if (!match) return Number.NaN;
  return Number(match[1]) * (match[2] === "s" ? 1000 : 1);
};

describe("reduced motion keeps gentle fades", () => {
  const osRoot = declarations(globals, ":root", true);
  const appRoot = declarations(globals, '[data-motion="reduced"]', false);

  for (const [label, decls] of [
    ["OS setting", osRoot],
    ["in-app switch", appRoot],
  ] as const) {
    it(`${label}: motion tokens stay long enough to see`, () => {
      for (const token of [
        "--duration-fast",
        "--duration-base",
        "--duration-slow",
        "--duration-panel",
      ]) {
        expect(toMs(value(decls, token))).toBeGreaterThanOrEqual(100);
      }
    });
  }

  it("never zeroes transitions, and lets only non-spatial properties ease", () => {
    const os = declarations(globals, "*", true);
    const app = declarations(globals, '[data-motion="reduced"] *', false);
    for (const decls of [os, app]) {
      expect(value(decls, "transition-duration")).toBe("var(--duration-base)");
      const props = (value(decls, "transition-property") ?? "")
        .replace("!important", "")
        .split(",")
        .map((prop) => prop.trim());
      expect(props).toContain("opacity");
      expect(props).toContain("visibility");
      for (const spatial of [
        "transform",
        "translate",
        "scale",
        "width",
        "height",
        "left",
        "right",
        "all",
      ]) {
        expect(props).not.toContain(spatial);
      }
    }
  });

  it("keeps the page crossfade; only the artwork flight is dropped", () => {
    // The root crossfade has a real duration and no reduced override.
    expect(
      toMs(
        value(
          declarations(motion, "::view-transition-group(root)", false),
          "animation-duration",
        ),
      ),
    ).toBeGreaterThanOrEqual(200);
    for (const inMedia of [true, false]) {
      expect(
        declarations(motion, "::view-transition-group(root)", inMedia).filter(
          (decl) => decl.prop.startsWith("animation") && inMedia,
        ),
      ).toEqual([]);
    }
    // Reduced: the morph group jumps, its old and new images still fade.
    const group = declarations(
      motion,
      "::view-transition-group(.vt-morph)",
      true,
    );
    expect(toMs(value(group, "animation-duration"))).toBeLessThan(1);
    const images = declarations(
      motion,
      "::view-transition-new(.vt-morph)",
      true,
    );
    expect(toMs(value(images, "animation-duration"))).toBeGreaterThanOrEqual(
      150,
    );
    // No blanket `animation: none` on every view-transition pseudo any more.
    const blanket = declarations(motion, "::view-transition-old(*)", true);
    expect(blanket).toEqual([]);
  });

  it("panels use a curve that is visible mid-move, not a front-loaded one", () => {
    const theme = globals.nodes.find(
      (node): node is AtRule =>
        node.type === "atrule" &&
        node.name === "theme" &&
        node.params === "static",
    );
    const ease = theme?.nodes
      ?.filter((node): node is Declaration => node.type === "decl")
      .find((decl) => decl.prop === "--ease-panel")?.value;
    const [x1, y1, x2, y2] = (
      /cubic-bezier\(([^)]+)\)/.exec(ease ?? "")?.[1] ?? ""
    )
      .split(",")
      .map(Number);
    // Solve the curve at 25% of the time: a front-loaded curve is already 75% done there.
    const at = (t: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const s = (lo + hi) / 2;
        const x =
          3 * (1 - s) ** 2 * s * (x1 ?? 0) +
          3 * (1 - s) * s * s * (x2 ?? 0) +
          s ** 3;
        if (x < t) lo = s;
        else hi = s;
      }
      const s = (lo + hi) / 2;
      return (
        3 * (1 - s) ** 2 * s * (y1 ?? 0) +
        3 * (1 - s) * s * s * (y2 ?? 0) +
        s ** 3
      );
    };
    expect(at(0.25)).toBeLessThan(0.5);
    expect(at(0.5)).toBeGreaterThan(0.6);
  });
});
