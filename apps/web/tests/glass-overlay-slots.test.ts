import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { OVERLAY_TARGETS } from "~/lib/glass/overlays";

const uiComponents = join(
  import.meta.dir,
  "../../../packages/ui/src/components/ui",
);
const glassCss = readFileSync(
  join(import.meta.dir, "../styles/glass.css"),
  "utf8",
);

const uiSource = readdirSync(uiComponents)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => readFileSync(join(uiComponents, file), "utf8"))
  .join("\n");

const slotsIn = (text: string) =>
  new Set([...text.matchAll(/data-slot="([a-z-]+)"/g)].map((m) => m[1]));

/** Overlay families in packages/ui. A new popup of one of these kinds must get glass rules. */
const POPUP_PATTERN =
  /^(popover|dropdown-menu|dropdown-menu-sub|dialog|alert-dialog|sheet|drawer|tooltip|select|hover-card|context-menu|menubar|command|combobox)-(content|popup)$/;
/** The inner body of a drawer, not a popup of its own. */
const NOT_A_POPUP = new Set(["drawer-content"]);

describe("overlay slots in glass.css", () => {
  test("every popup packages/ui renders is styled as glass", () => {
    const styled = slotsIn(glassCss);
    const popups = [...slotsIn(uiSource)].filter(
      (slot) => POPUP_PATTERN.test(slot) && !NOT_A_POPUP.has(slot),
    );
    expect(popups.length).toBeGreaterThan(0);
    for (const slot of popups) {
      expect({ slot, styled: styled.has(slot) }).toEqual({
        slot,
        styled: true,
      });
    }
  });

  test("every overlay slot glass.css names is a real packages/ui slot", () => {
    const rendered = slotsIn(uiSource);
    for (const slot of slotsIn(glassCss)) {
      expect({ slot, rendered: rendered.has(slot) }).toEqual({
        slot,
        rendered: true,
      });
    }
  });

  test("the engine's lens targets are styled too", () => {
    for (const { selector } of OVERLAY_TARGETS) {
      if (!selector.startsWith("[data-slot=")) continue;
      const slot = /data-slot="([a-z-]+)"/.exec(selector)?.[1];
      expect(slot && glassCss.includes(`data-slot="${slot}"`)).toBe(true);
    }
  });

  test("tooltips take the material but never the lens", () => {
    const lensStart = glassCss.indexOf(
      'html[data-glass-engine="lens"]:not([data-glass-level="solid"])',
    );
    expect(lensStart).toBeGreaterThan(-1);
    const lensRule = glassCss.slice(
      lensStart,
      glassCss.indexOf("\n}", lensStart),
    );
    expect(lensRule).toContain("[data-sonner-toast]");
    expect(lensRule).not.toContain("tooltip-content");
    expect(glassCss).toContain('[data-slot="tooltip-content"]');
  });
});
