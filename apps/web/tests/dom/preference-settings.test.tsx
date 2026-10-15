import { afterEach, describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PreferenceSettings } from "../../app/(root)/settings/_components/preference-settings";
import { setInputValue } from "./set-input-value";
import {
  createTestRouter,
  findButton,
  requireElement,
} from "./settings-test-utils";

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async () => {},
}));

const { radiusPatch, radiusToPx } =
  await import("../../app/(root)/settings/_components/appearance-options");
const { AppearanceSettings, ResetAppearanceButton } =
  await import("../../app/(root)/settings/_components/appearance-settings");
const { ThemeConfigProvider } = await import("../../lib/theme/provider");

async function mountAppearance(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => {
    root.render(<ThemeConfigProvider>{node}</ThemeConfigProvider>);
  });
  return container;
}

const html = document.documentElement;

// Every mounted provider re-applies its own config to <html> whenever it
// renders (its debounced save flips `isSaving`). A provider left mounted by an
// earlier test would do that mid-way through a later one and clobber its
// values, so each test unmounts what it mounted.
const mounted: Root[] = [];
afterEach(async () => {
  await act(async () => {
    for (const root of mounted.splice(0)) root.unmount();
  });
  document.body.innerHTML = "";
  html.removeAttribute("style");
  html.removeAttribute("data-density");
});

describe("keyboard shortcuts setting", () => {
  it("is a labelled switch that toggles the stored preference", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mounted.push(root);
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={createTestRouter()}>
          <PreferenceSettings initialLanguages={[]} />
        </AppRouterContext.Provider>,
      );
    });

    const toggle = requireElement(container, "[role=switch]", HTMLElement);
    expect(toggle).not.toBeNull();
    const labelId = toggle.getAttribute("aria-labelledby") ?? "";
    expect(document.getElementById(labelId)?.textContent).toBe(
      "Keyboard shortcuts",
    );

    const before = toggle.getAttribute("aria-checked");
    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-checked")).not.toBe(before);
  });
});

describe("appearance patches", () => {
  it("converts slider pixels to rem and clamps to 0..24px", () => {
    expect(radiusPatch(12)).toEqual({ radius: 0.75 });
    expect(radiusPatch(-4)).toEqual({ radius: 0 });
    expect(radiusPatch(99)).toEqual({ radius: 1.5 });
    expect(radiusPatch(7.6)).toEqual({ radius: 0.5 });
    expect(radiusToPx(0.3)).toBe(5);
  });
});

describe("appearance settings", () => {
  it("applies a density choice to the page at once and resets it", async () => {
    const container = await mountAppearance(
      <>
        <AppearanceSettings />
        <ResetAppearanceButton />
      </>,
    );

    const compact = requireElement(
      container,
      "[role=radiogroup][aria-label=Density] input[value=compact]",
      HTMLInputElement,
    );
    await act(async () => compact.click());
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(compact.checked).toBe(true);

    const reset = findButton(container, "Reset to defaults");
    expect(reset.disabled).toBe(false);
    await act(async () => reset.click());
    expect(html.getAttribute("data-density")).toBe("comfortable");
  });

  it("drives the radius from the slider in whole pixels", async () => {
    const container = await mountAppearance(<AppearanceSettings />);

    const slider = requireElement(
      container,
      "input[type=range]",
      HTMLInputElement,
    );
    expect(slider.min).toBe("0");
    expect(slider.max).toBe("24");
    await act(async () => setInputValue(slider, "24"));
    expect(html.style.getPropertyValue("--radius")).toBe("1.5rem");
    expect(container.querySelector("output")?.textContent).toBe("24px");
  });
});
