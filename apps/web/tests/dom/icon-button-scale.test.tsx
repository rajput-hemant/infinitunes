import { describe, expect, it } from "bun:test";

import { Button } from "@infinitunes/ui/components/button";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { ICON_CONTROL_SIZES, controlStyles } from "../../lib/control-styles";
import { cn } from "../../lib/utils";

/** Icon-only roles and the glyph size each must carry. */
const iconRoles = {
  headerIcon: 4,
  rowIcon: 4,
  heroIcon: 4,
  cardPlay: 4,
  transport: 4,
  transportPlayMini: 5,
  transportPlay: 6,
} as const;

const SCALE: number[] = [...ICON_CONTROL_SIZES];
const VARIABLE_PX: Record<string, number> = { ctl: 32, "ctl-lg": 36 };

/** The box size class a control resolves to after `cn`, in fine-pointer px. */
function boxOf(classes: string) {
  const tokens = classes.split(" ");
  const squares = tokens.filter((token) => /^size-/.test(token));
  expect(squares).toHaveLength(1);
  // Width and height must come from that single `size-*`, never `h-`/`w-`.
  expect(tokens.some((token) => /^(h|w)-/.test(token))).toBe(false);
  const match = /^size-(?:\(--([\w-]+)\)|(\d+))$/.exec(squares[0] ?? "");
  if (!match) throw new Error(`unrecognised size in "${classes}"`);
  return match[1] ? VARIABLE_PX[match[1]] : Number(match[2]) * 4;
}

async function renderButtons(buttons: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(buttons);
  });
  return {
    container,
    cleanup() {
      root.unmount();
      container.remove();
    },
  };
}

describe("icon-only button scale", () => {
  it("renders every role as a square from the scale with the control radius", async () => {
    const { container, cleanup } = await renderButtons(
      <>
        {Object.keys(iconRoles).map((role) => (
          <button
            key={role}
            type="button"
            aria-label={role}
            className={controlStyles[role as keyof typeof iconRoles]}
          >
            <svg aria-hidden />
          </button>
        ))}
      </>,
    );
    for (const role of Object.keys(iconRoles)) {
      const button = container.querySelector(`[aria-label="${role}"]`);
      const classes = button?.className ?? "";
      expect(SCALE, role).toContain(boxOf(classes));
      expect(classes.split(" "), role).toContain("rounded-(--r-ctl)");
      expect(classes, role).not.toContain("rounded-full");
      expect(classes.split(" "), role).toContain("shrink-0");
    }
    cleanup();
  });

  it("gives each role the glyph size of its control size", () => {
    for (const [role, glyph] of Object.entries(iconRoles)) {
      const classes = controlStyles[role as keyof typeof iconRoles];
      expect(classes.split(" "), role).toContain(`[&_svg]:size-${glyph}`);
    }
    // 16px in the 32 and 36 controls, 20px in 40, 24px in 56.
    expect(iconRoles.headerIcon).toBe(4);
    expect(iconRoles.transportPlayMini).toBe(5);
  });

  it("keeps the shared Button icon variants square, on the scale and on the control radius", async () => {
    const { container, cleanup } = await renderButtons(
      <>
        {(["icon", "icon-sm", "icon-lg"] as const).map((size) => (
          <Button key={size} size={size} aria-label={size} variant="ghost">
            <svg aria-hidden />
          </Button>
        ))}
      </>,
    );
    for (const size of ["icon", "icon-sm", "icon-lg"]) {
      const classes =
        container.querySelector(`[aria-label="${size}"]`)?.className ?? "";
      // Strip the base `rounded-lg` the way a variant override resolves it.
      expect(SCALE, size).toContain(boxOf(classes));
      expect(classes.split(" "), size).toContain("rounded-(--r-ctl)");
      expect(classes.split(" "), size).not.toContain("rounded-lg");
    }
    cleanup();
  });

  it("lets a role replace a component's own size and radius", () => {
    const merged = cn("size-9 rounded-full", controlStyles.headerIcon);
    expect(boxOf(merged)).toBe(32);
    expect(merged.split(" ")).toContain("rounded-(--r-ctl)");
  });
});
