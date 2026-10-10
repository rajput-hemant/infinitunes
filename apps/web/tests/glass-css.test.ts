import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { OVERLAY_TARGETS } from "~/lib/glass/overlays";

const styles = join(import.meta.dir, "../styles");
const uiComponents = join(
  import.meta.dir,
  "../../../packages/ui/src/components/ui",
);
const read = (path: string) => readFileSync(path, "utf8");

const glassCss = read(join(styles, "glass.css"));
const sheets = [glassCss, read(join(styles, "globals.css"))].join("\n");

describe("glass.css overlay coverage", () => {
  test("styles every popup the engine registers", () => {
    for (const { selector } of OVERLAY_TARGETS) {
      expect(glassCss).toContain(selector);
    }
  });

  test("only names data-slot values packages/ui really renders", () => {
    const rendered = readdirSync(uiComponents)
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => read(join(uiComponents, file)))
      .join("\n");
    const slots = [...glassCss.matchAll(/data-slot="([a-z-]+)"/g)].map(
      (m) => m[1],
    );
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of new Set(slots)) {
      expect(rendered).toContain(`data-slot="${slot}"`);
    }
  });
});

describe("glass.css transport", () => {
  test("keys on the attributes the theme and runtime really set", () => {
    for (const hook of [
      'data-glass-level="solid"',
      'data-glass-level="subtle"',
      'data-glass-engine="lens"',
      'data-glass-variant="clear"',
      'data-glass-variant="tinted"',
      'data-glass-accent-tint="true"',
      'data-motion="reduced"',
      'data-ambient="off"',
    ]) {
      expect(glassCss).toContain(hook);
    }
  });

  test("keeps no mockup-only selectors or classes nothing sets", () => {
    for (const dead of [
      /\.side\b/,
      /\.qpane\b/,
      /\.player\b/,
      /\.bar\b/,
      /#tabbar/,
      /\.seg\b/,
      /\.menu\b/,
      /\.toast\b/,
      /\.lg-/,
      /glass-off/,
      /\breduce-motion\b/,
      /#ambient/,
    ]) {
      expect(glassCss).not.toMatch(dead);
    }
  });

  test("uses only custom properties that something defines", () => {
    const used = new Set(
      [...glassCss.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]),
    );
    const defined = new Set(
      [...sheets.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
    );
    // Written per element or per page at runtime, or by Tailwind and Base UI.
    const runtime = new Set([
      "--g-lens-url",
      "--g-light",
      "--g-px",
      "--g-py",
      "--g-press",
      "--g-edge-l",
      "--g-edge-r",
      "--g-a-add",
      "--g-con",
      "--g-k",
      "--g-muted-k",
      "--g-drop",
      "--g-inner",
    ]);
    const undefinedVars = [...used].filter(
      (name) => !defined.has(name) && !runtime.has(name),
    );
    expect(undefinedVars).toEqual([]);
  });
});

describe("ambient default", () => {
  test("is the mockup's 0.62, in light and dark", () => {
    const globals = read(join(styles, "globals.css"));
    expect(globals).toMatch(/--ambient:\s*0\.62;/);
    expect(globals).not.toMatch(/--ambient:\s*0\.(22|32);/);
  });
});
