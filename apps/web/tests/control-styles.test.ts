import { describe, expect, it } from "bun:test";

import { cn } from "@infinitunes/ui/lib/utils";

import { controlStyles } from "../lib/control-styles";

const globals = await Bun.file(
  new URL("../styles/globals.css", import.meta.url),
).text();

const px = (rem: string) => Number.parseFloat(rem) * 16;

function variable(name: string, scope: "fine" | "coarse") {
  const source =
    scope === "coarse"
      ? globals.slice(globals.indexOf("@media (pointer: coarse)"))
      : globals;
  const value = new RegExp(`--${name}:\\s*([\\d.]+)rem;`).exec(source)?.[1];
  if (!value) throw new Error(`--${name} not defined for ${scope} pointers`);
  return px(value);
}

/** Visual size in px of a control's classes on the given pointer, from the shipped stylesheet. */
function sizeOf(classes: string, scope: "fine" | "coarse") {
  const size = /(?:^|\s)(?:size|h)-(?:\(--([\w-]+)\)|(\d+))(?=\s|$)/.exec(
    classes,
  );
  if (!size) throw new Error(`no height in "${classes}"`);
  return size[1] ? variable(size[1], scope) : Number(size[2]) * 4;
}

/** Size of the area that receives taps, including the coarse-pointer hit expansion. */
function hitSizeOf(classes: string, scope: "fine" | "coarse") {
  const size = sizeOf(classes, scope);
  const grows = classes.includes("pointer-coarse:after:-inset-0.5");
  return scope === "coarse" && grows ? size + 4 : size;
}

const contract = {
  text: { fine: 32, coarse: 40, tap: 40 },
  textLg: { fine: 36, coarse: 44, tap: 44 },
  headerIcon: { fine: 32, coarse: 40, tap: 44 },
  rowIcon: { fine: 32, coarse: 40, tap: 44 },
  hero: { fine: 36, coarse: 44, tap: 44 },
  heroIcon: { fine: 36, coarse: 44, tap: 44 },
  transport: { fine: 32, coarse: 40, tap: 44 },
  transportPlayMini: { fine: 40, coarse: 40, tap: 44 },
  transportPlay: { fine: 56, coarse: 56, tap: 56 },
} as const;

describe("controlStyles", () => {
  it("covers exactly the roles of the contract", () => {
    expect(Object.keys(controlStyles).toSorted()).toEqual(
      Object.keys(contract).toSorted(),
    );
  });

  it("keeps the roles other code already imports", () => {
    for (const role of [
      "text",
      "headerIcon",
      "rowIcon",
      "hero",
      "heroIcon",
      "transport",
      "transportPlay",
    ] as const) {
      expect(controlStyles[role]).toBeString();
    }
  });

  for (const [role, sizes] of Object.entries(contract)) {
    it(`${role} measures ${sizes.fine}px, ${sizes.coarse}px on touch, ${sizes.tap}px to tap`, () => {
      const classes = controlStyles[role as keyof typeof controlStyles];
      expect(sizeOf(classes, "fine")).toBe(sizes.fine);
      expect(sizeOf(classes, "coarse")).toBe(sizes.coarse);
      expect(hitSizeOf(classes, "coarse")).toBe(sizes.tap);
    });
  }

  it("never leaves a touch target under 40px", () => {
    for (const classes of Object.values(controlStyles)) {
      expect(hitSizeOf(classes, "coarse")).toBeGreaterThanOrEqual(40);
    }
  });

  it("gives every icon-only control a 44px tap area on touch screens", () => {
    for (const role of [
      "headerIcon",
      "rowIcon",
      "transport",
      "transportPlayMini",
    ] as const) {
      expect(
        hitSizeOf(controlStyles[role], "coarse"),
        role,
      ).toBeGreaterThanOrEqual(44);
    }
  });

  it("is recognized by cn, so a component's own size and radius are replaced", () => {
    const merged = cn("h-9 w-9 rounded-md px-4", controlStyles.text);
    expect(merged.split(" ")).not.toContain("h-9");
    expect(merged.split(" ")).not.toContain("rounded-md");
    expect(merged.split(" ")).not.toContain("px-4");
    expect(
      cn("size-8 rounded-md", controlStyles.headerIcon).split(" "),
    ).not.toContain("size-8");
  });
});
