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
    Array.from(
      container.querySelectorAll<HTMLInputElement>("input[type=radio]"),
    );
  const label = (radio: HTMLInputElement) =>
    radio.closest("label")?.textContent ?? "";
  return {
    container,
    updates,
    radios,
    label,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("accent swatches", () => {
  it("is a named group with one named radio per preset", async () => {
    const view = await mount("blue");
    const legend = view.container.querySelector("fieldset > legend");
    expect(legend?.textContent).toBe("Accent color");
    expect(view.radios().map(view.label)).toEqual(
      themes.map((theme) => theme.label),
    );
    // One shared name, so the browser keeps a single tab stop for the group.
    expect(new Set(view.radios().map((r) => r.name)).size).toBe(1);
    const checked = view.radios().filter((r) => r.checked);
    expect(checked.map(view.label)).toEqual(["Blue"]);
    await view.cleanup();
  });

  it("updates the theme config with the picked preset", async () => {
    const view = await mount("zinc");
    const violet = view.radios().find((r) => view.label(r) === "Violet");
    await act(async () => violet?.click());
    expect(view.updates).toEqual([{ accent: "violet" }]);
    await view.cleanup();
  });

  it("keeps arrow keys from reaching the surrounding menu", async () => {
    const view = await mount("zinc");
    const reached: string[] = [];
    // An ancestor, like the menu: React's own root listener sits on the container.
    const onKey = (e: KeyboardEvent) => void reached.push(e.key);
    document.body.addEventListener("keydown", onKey);
    const first = view.radios()[0];
    for (const key of ["ArrowLeft", "ArrowDown", "Escape"]) {
      first?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
    }
    document.body.removeEventListener("keydown", onKey);
    expect(reached).toEqual(["Escape"]);
    await view.cleanup();
  });

  it("leaves every preset unchecked for a custom accent", async () => {
    const view = await mount("#123456");
    expect(view.radios().some((r) => r.checked)).toBe(false);
    await view.cleanup();
  });
});
