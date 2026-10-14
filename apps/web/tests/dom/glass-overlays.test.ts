import { describe, expect, it } from "bun:test";

import { targetFor } from "../../components/glass/start-glass-runtime";
import {
  OVERLAY_TARGETS,
  isGlassRole,
  materializes,
  overlayTargetFor,
} from "../../lib/glass/overlays";

function popup(attr: string, value = "") {
  const el = document.createElement("div");
  el.setAttribute(attr, value);
  return el;
}

describe("overlay targets", () => {
  it("resolves every popup slot to a role and size", () => {
    for (const { selector, role, size } of OVERLAY_TARGETS) {
      const match = /\[(data-[a-z-]+)(?:="([^"]+)")?\]/.exec(selector);
      if (!match) throw new Error(`unparseable selector ${selector}`);
      const el = popup(match[1], match[2] ?? "");
      expect(overlayTargetFor(el)).toMatchObject({ role, size });
    }
  });

  it("leaves tooltips and plain elements alone", () => {
    expect(
      overlayTargetFor(popup("data-slot", "tooltip-content")),
    ).toBeUndefined();
    expect(overlayTargetFor(document.createElement("div"))).toBeUndefined();
  });

  it("only menus, dialogs, palettes and toasts materialize", () => {
    expect(
      ["menu", "dialog", "palette", "toast"].every((r) =>
        materializes(isGlassRole(r) ? r : undefined),
      ),
    ).toBe(true);
    for (const role of [
      "player",
      "tabbar",
      "toolbar",
      "sidebar",
      "queue",
      "sheet",
    ] as const) {
      expect(materializes(role)).toBe(false);
    }
    expect(materializes(undefined)).toBe(false);
  });

  it("validates role names", () => {
    expect(isGlassRole("tabbar")).toBe(true);
    expect(isGlassRole("card")).toBe(false);
    expect(isGlassRole(undefined)).toBe(false);
  });
});

describe("targetFor", () => {
  it("prefers the element's own size and role over its slot", () => {
    const el = popup("data-slot", "dropdown-menu-content");
    el.setAttribute("data-glass-size", "s");
    el.setAttribute("data-glass-role", "toolbar");
    expect(targetFor(el)).toEqual({ size: "s", role: "toolbar" });
  });

  it("falls back to the slot, and to nothing for an unknown element", () => {
    expect(targetFor(popup("data-slot", "dialog-content"))).toEqual({
      size: "l",
      role: "dialog",
    });
    expect(targetFor(document.createElement("div"))).toBeNull();
  });

  it("ignores an invalid role or size attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-glass-size", "xxl");
    expect(targetFor(el)).toBeNull();
    el.setAttribute("data-glass-size", "m");
    el.setAttribute("data-glass-role", "card");
    expect(targetFor(el)).toEqual({ size: "m", role: undefined });
  });
});
