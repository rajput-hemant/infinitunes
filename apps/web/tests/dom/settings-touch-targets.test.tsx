import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { controlStyles } from "../../lib/control-styles";

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async () => {},
}));

const { PreferenceSettings } =
  await import("../../app/(root)/settings/_components/preference-settings");
const { AppearanceSettings } =
  await import("../../app/(root)/settings/_components/appearance-settings");
const { ThemeConfigProvider } = await import("../../lib/theme/provider");

const heightClass = (style: string) => style.split(" ")[0]!;

async function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  await act(async () => {
    createRoot(container).render(node);
  });
  return container;
}

describe("settings touch targets", () => {
  it("sizes preference buttons from the shared control styles", async () => {
    const container = await mount(
      <AppRouterContext.Provider value={{ refresh() {} } as never}>
        <PreferenceSettings initialLanguages={[]} />
      </AppRouterContext.Provider>,
    );

    const controls = container.querySelectorAll("button");
    expect(controls.length).toBeGreaterThan(0);
    const allowed = [controlStyles.text, controlStyles.textLg].map(heightClass);
    for (const control of controls) {
      const classes = control.className.split(" ");
      expect(allowed.some((height) => classes.includes(height))).toBe(true);
    }
  });

  it("sizes every appearance option from the shared control styles", async () => {
    const container = await mount(
      <ThemeConfigProvider>
        <AppearanceSettings />
      </ThemeConfigProvider>,
    );

    const options = container.querySelectorAll(
      "[role=radiogroup][aria-label='Density'] label",
    );
    expect(options.length).toBe(2);
    for (const option of options) {
      expect(option.className.split(" ")).toContain(
        heightClass(controlStyles.text),
      );
    }
  });
});
