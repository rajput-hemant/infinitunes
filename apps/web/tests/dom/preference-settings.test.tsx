import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { PreferenceSettings } from "../../app/(root)/settings/_components/preference-settings";
import { setInputValue } from "./set-input-value";

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async () => {},
}));

const { accentPatch, radiusPatch, radiusToPx } =
  await import("../../app/(root)/settings/_components/appearance-options");
const { AppearanceSettings } =
  await import("../../app/(root)/settings/_components/appearance-settings");
const { ThemeConfigProvider } = await import("../../lib/theme/provider");

async function mountAppearance(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  await act(async () => {
    createRoot(container).render(
      <ThemeConfigProvider>{node}</ThemeConfigProvider>,
    );
  });
  return container;
}

const html = document.documentElement;

describe("keyboard shortcuts setting", () => {
  it("is a labelled switch that toggles the stored preference", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={{ refresh() {} } as never}>
          <PreferenceSettings initialLanguages={[]} />
        </AppRouterContext.Provider>,
      );
    });

    const toggle = container.querySelector("[role=switch]") as HTMLElement;
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

  it("accepts a complete hex with or without the hash and rejects the rest", () => {
    expect(accentPatch("#3A7BD5")).toEqual({ accent: "#3a7bd5" });
    expect(accentPatch("fff")).toEqual({ accent: "#ffffff" });
    expect(accentPatch("#12")).toBeNull();
    expect(accentPatch("blue")).toBeNull();
    expect(accentPatch("")).toBeNull();
  });
});

describe("appearance settings", () => {
  it("applies a density choice to the page at once and resets it", async () => {
    const container = await mountAppearance(<AppearanceSettings />);

    const compact = container.querySelector(
      "[role=radiogroup][aria-label=Density] input[value=compact]",
    ) as HTMLInputElement;
    await act(async () => compact.click());
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(compact.checked).toBe(true);

    const reset = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Reset to defaults"),
    ) as HTMLButtonElement;
    expect(reset.disabled).toBe(false);
    await act(async () => reset.click());
    expect(html.getAttribute("data-density")).toBe("comfortable");
  });

  it("drives the radius from the slider in whole pixels", async () => {
    const container = await mountAppearance(<AppearanceSettings />);

    const slider = container.querySelector(
      "input[type=range]",
    ) as HTMLInputElement;
    expect(slider.min).toBe("0");
    expect(slider.max).toBe("24");
    await act(async () => setInputValue(slider, "24"));
    expect(html.style.getPropertyValue("--radius")).toBe("1.5rem");
    expect(container.querySelector("output")?.textContent).toBe("24px");
  });

  it("applies a typed accent only while the hex is complete", async () => {
    const container = await mountAppearance(<AppearanceSettings />);

    const hex = container.querySelector(
      "input[aria-label='Accent hex color']",
    ) as HTMLInputElement;
    await act(async () => setInputValue(hex, "#3a7b"));
    expect(hex.getAttribute("aria-invalid")).toBe("true");
    expect(html.style.getPropertyValue("--light-primary")).toBe("");

    await act(async () => setInputValue(hex, "#3a7bd5"));
    expect(hex.getAttribute("aria-invalid")).toBe("false");
    expect(html.style.getPropertyValue("--light-primary")).not.toBe("");
  });
});
