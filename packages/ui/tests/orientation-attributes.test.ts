import { describe, expect, it } from "bun:test";
// REG-002: Base UI primitives expose orientation as
// data-orientation="horizontal|vertical". Tailwind selectors keyed on bare
// data-horizontal / data-vertical never match, collapsing tracks to 0px.
// This contract pins every ui component to the attribute Base UI sets.
import { fileURLToPath } from "node:url";

import { Glob } from "bun";

const SRC = new URL("../src/components/", import.meta.url);
const SRC_DIR = fileURLToPath(SRC);

// Bare presence selectors for attributes Base UI never renders.
const PHANTOM =
  /(^|[^-[\w\]/])data-(horizontal|vertical):|group-data-(horizontal|vertical)\/|group-has-data-(horizontal|vertical)\//;

const EXPECTED_ORIENTATION_SELECTOR: Record<string, string[]> = {
  "ui/slider.tsx": [
    "data-[orientation=horizontal]",
    "data-[orientation=vertical]",
  ],
  "ui/scroll-area.tsx": [
    "data-[orientation=horizontal]",
    "data-[orientation=vertical]",
  ],
  "ui/separator.tsx": [
    "data-[orientation=horizontal]",
    "data-[orientation=vertical]",
  ],
  "ui/tabs.tsx": ["orientation=horizontal", "orientation=vertical"],
  "ui/toggle-group.tsx": ["orientation=horizontal", "orientation=vertical"],
  "ui/field.tsx": ["orientation=horizontal"],
};

describe("orientation selectors match base ui attributes", () => {
  it("no component keys styles on phantom data-horizontal/data-vertical", async () => {
    const glob = new Glob("**/*.tsx");
    const offenders: string[] = [];
    for await (const file of glob.scan({ cwd: SRC_DIR, absolute: false })) {
      const src = await Bun.file(new URL(file, SRC)).text();
      if (PHANTOM.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  for (const [file, selectors] of Object.entries(
    EXPECTED_ORIENTATION_SELECTOR,
  )) {
    it(`${file} targets data-orientation`, async () => {
      const src = await Bun.file(new URL(file, SRC)).text();
      for (const selector of selectors) {
        expect(src).toContain(selector);
      }
    });
  }
});
