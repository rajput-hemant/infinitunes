import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { OVERLAY_TARGETS } from "~/lib/glass/overlays";
import { DEFAULT_GLASS_TUNING } from "~/lib/glass/tuning";

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

describe("glass.css tuning defaults", () => {
  const rootBlock = /^:root \{([^}]*)\}/m.exec(glassCss)?.[1] ?? "";

  test("the stylesheet literals equal the shared defaults", () => {
    const declared = (name: string) =>
      new RegExp(`--glass-${name}:\\s*([^;\\s]+)`).exec(rootBlock)?.[1];
    expect(Number(declared("depth"))).toBe(DEFAULT_GLASS_TUNING.depth);
    expect(Number(declared("splay"))).toBe(DEFAULT_GLASS_TUNING.splay);
    expect(Number(declared("feather"))).toBe(DEFAULT_GLASS_TUNING.feather);
    expect(Number(declared("curve"))).toBe(DEFAULT_GLASS_TUNING.curve);
    expect(Number(declared("chroma"))).toBe(DEFAULT_GLASS_TUNING.chroma);
    expect(declared("blur")).toBe(`${DEFAULT_GLASS_TUNING.blur}px`);
    expect(Number(declared("glint"))).toBe(DEFAULT_GLASS_TUNING.glint / 100);
    expect(Number(declared("tint"))).toBe(DEFAULT_GLASS_TUNING.tint);
    expect(declared("tint-c")).toBe(DEFAULT_GLASS_TUNING.tintColor);
  });

  test("is neutral: the pink, indigo and sky blobs are gone", () => {
    expect(glassCss).not.toMatch(/#(?:f472b6|818cf8|38bdf8)/i);
    expect(glassCss).not.toContain("--g-blob");
  });
});

describe("glass.css transport", () => {
  test("keys on the attributes the theme and runtime really set", () => {
    for (const hook of [
      'data-glass-level="solid"',
      'data-glass-level="subtle"',
      'data-glass-engine="lens"',
      'data-glass-tint="on"',
      'data-motion="reduced"',
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
      /data-glass-ambient/,
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
      "--g-lens-tint",
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
