import { describe, expect, it } from "bun:test";

import type { ThemeConfig } from "@infinitunes/types";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { AccentSwatches } from "../../components/accent-swatches";
import { themes } from "../../config/themes";
import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { ThemeConfigContext } from "../../lib/theme/provider";

async function mount(accent: string) {
  const updates: Partial<ThemeConfig>[] = [];
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <ThemeConfigContext.Provider
        value={{
          config: { ...DEFAULT_THEME_CONFIG, accent },
          update: (patch) => void updates.push(patch),
          reset: () => {},
          isDefault: false,
          isSaving: false,
        }}
      >
        <AccentSwatches />
      </ThemeConfigContext.Provider>,
    );
  });
  const radios = () =>
    Array.from(container.querySelectorAll<HTMLElement>("[role=radio]"));
  return {
    container,
    updates,
    radios,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("accent swatches", () => {
  it("is a named radiogroup with one named radio per preset", async () => {
    const view = await mount("blue");
    const group = view.container.querySelector("[role=radiogroup]");
    expect(group?.getAttribute("aria-label")).toBe("Accent color");
    expect(view.radios().map((r) => r.getAttribute("aria-label"))).toEqual(
      themes.map((theme) => theme.label),
    );
    const checked = view
      .radios()
      .filter((r) => r.getAttribute("aria-checked") === "true");
    expect(checked.map((r) => r.getAttribute("aria-label"))).toEqual(["Blue"]);
    // Roving tab stop: only the selected swatch is tabbable.
    expect(view.radios().filter((r) => r.tabIndex === 0)).toHaveLength(1);
    await view.cleanup();
  });

  it("updates the theme config with the picked preset", async () => {
    const view = await mount("zinc");
    const violet = view.radios().find((r) => r.title === "Violet");
    await act(async () => violet?.click());
    expect(view.updates).toEqual([{ accent: "violet" }]);
    await view.cleanup();
  });

  it("moves selection with the arrow keys and wraps", async () => {
    const view = await mount("zinc");
    const first = view.radios()[0];
    first?.focus();
    await act(async () => {
      first?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
    });
    expect(view.updates).toEqual([{ accent: themes.at(-1)?.name }]);
    await view.cleanup();
  });

  it("keeps a tab stop when the accent is custom", async () => {
    const view = await mount("#123456");
    expect(
      view.radios().every((r) => r.getAttribute("aria-checked") === "false"),
    ).toBe(true);
    expect(view.radios().filter((r) => r.tabIndex === 0)).toHaveLength(1);
    await view.cleanup();
  });
});
