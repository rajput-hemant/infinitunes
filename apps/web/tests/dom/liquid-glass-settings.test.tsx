import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { ThemeConfig } from "@infinitunes/types";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

const saved: ThemeConfig[] = [];

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async (input: ThemeConfig) => {
    saved.push(input);
  },
}));

const { AppearanceSettings } =
  await import("../../app/(root)/settings/_components/appearance-settings");
const { LiquidGlassSettings } =
  await import("../../app/(root)/settings/_components/liquid-glass-settings");
const { ThemeConfigProvider } = await import("../../lib/theme/provider");
const { applyThemeConfig } = await import("../../lib/theme/html");
const { DEFAULT_THEME_CONFIG } = await import("../../lib/theme-config");

const html = document.documentElement;
const mounted: { unmount: () => void }[] = [];

async function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => {
    root.render(<ThemeConfigProvider>{node}</ThemeConfigProvider>);
  });
  return container;
}

/** Lets the provider's debounced save run, then returns the last config it sent. */
async function settleSave() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  return saved.at(-1);
}

function sliderFor(container: HTMLElement, label: string) {
  const text = [...container.querySelectorAll("label")].find(
    (element) => element.textContent === label,
  );
  const slider = text && document.getElementById(text.htmlFor);
  if (!(slider instanceof HTMLInputElement)) {
    throw new Error(`No slider labelled ${label}`);
  }
  return slider;
}

/** The switch whose visible label is `label`, found through its `aria-labelledby`. */
function switchFor(container: HTMLElement, label: string) {
  const text = [...container.querySelectorAll("p")].find(
    (element) => element.textContent === label,
  );
  const toggle = container.querySelector(
    `[role=switch][aria-labelledby='${text?.id ?? ""}']`,
  );
  if (!(toggle instanceof HTMLElement)) throw new Error(`No switch ${label}`);
  return toggle;
}

function outputFor(container: HTMLElement, label: string) {
  const slider = sliderFor(container, label);
  return container.querySelector(`output[for='${slider.id}']`);
}

function buttonNamed(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === name,
  );
  if (!button) throw new Error(`No button named ${name}`);
  return button;
}

function radio(container: HTMLElement, group: string, value: string) {
  const input = container.querySelector(
    `[role=radiogroup][aria-label='${group}'] input[value=${value}]`,
  );
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No ${value} option in ${group}`);
  }
  return input;
}

beforeEach(() => {
  for (const root of mounted.splice(0)) {
    act(() => root.unmount());
  }
  saved.length = 0;
  applyThemeConfig(html, DEFAULT_THEME_CONFIG);
});

describe("liquid glass tuning", () => {
  it("moves the blur slider live and saves the blur key", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const blur = sliderFor(container, "Blur");

    await act(async () => setInputValue(blur, "8"));

    expect(html.style.getPropertyValue("--glass-blur")).toBe("8px");
    expect(sliderFor(container, "Blur").value).toBe("8");
    expect(outputFor(container, "Blur")?.textContent).toBe("8px");
    const config = await settleSave();
    expect(config?.glassTuning.blur).toBe(8);
    expect(config?.glassTuning.sat).toBe(DEFAULT_THEME_CONFIG.glassTuning.sat);
  });

  it("stores transparency as the complement of the shown value", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const transparency = sliderFor(container, "Transparency");
    expect(transparency.value).toBe("0.86");

    await act(async () => setInputValue(transparency, "0.8"));

    expect(html.style.getPropertyValue("--glass-tint")).toBe("0.2");
    const config = await settleSave();
    expect(config?.glassTuning.tint).toBe(0.2);
  });

  it("maps the saturation and edge highlight sliders to their config keys", async () => {
    const container = await mount(<LiquidGlassSettings />);

    await act(async () =>
      setInputValue(sliderFor(container, "Saturation"), "2"),
    );
    await act(async () =>
      setInputValue(sliderFor(container, "Edge highlight"), "0.5"),
    );

    expect(html.style.getPropertyValue("--glass-sat")).toBe("2");
    expect(html.style.getPropertyValue("--glass-spec")).toBe("0.5");
    const config = await settleSave();
    expect(config?.glassTuning.sat).toBe(2);
    expect(config?.glassTuning.spec).toBe(0.5);
  });

  it("changes the variant and the accent tint through the config", async () => {
    const container = await mount(<LiquidGlassSettings />);

    await act(async () => radio(container, "Glass variant", "clear").click());
    expect(html.getAttribute("data-glass-variant")).toBe("clear");
    expect(radio(container, "Glass variant", "clear").checked).toBe(true);

    const accentTint = switchFor(container, "Tint follows accent");
    await act(async () => accentTint.click());
    expect(html.getAttribute("data-glass-accent-tint")).toBe("true");
    expect(accentTint.getAttribute("aria-checked")).toBe("true");

    const config = await settleSave();
    expect(config?.glassTuning.variant).toBe("clear");
    expect(config?.glassTuning.accentTint).toBe(true);
  });

  it("dims the tuning controls while the glass level is solid", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const fieldset = container.querySelector("fieldset");
    expect(fieldset?.disabled).toBe(false);

    await act(async () => radio(container, "Glass level", "solid").click());

    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });

  it("reset glass restores the tuning and ambient defaults", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await act(async () => setInputValue(sliderFor(container, "Blur"), "12"));
    await act(async () => radio(container, "Glass variant", "tinted").click());
    expect(buttonNamed(container, "Reset glass").disabled).toBe(false);

    await act(async () => buttonNamed(container, "Reset glass").click());

    expect(html.style.getPropertyValue("--glass-blur")).toBe("");
    expect(html.getAttribute("data-glass-variant")).toBeNull();
    expect(sliderFor(container, "Blur").value).toBe("3");
    expect(radio(container, "Glass variant", "regular").checked).toBe(true);
    expect(buttonNamed(container, "Reset glass").disabled).toBe(true);
  });

  it("toggles the ambient background", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const ambient = switchFor(container, "Ambient background");
    expect(ambient.getAttribute("aria-checked")).toBe("true");

    await act(async () => ambient.click());

    expect(html.getAttribute("data-ambient")).toBe("off");
  });

  it("page reset restores the glass tuning with everything else", async () => {
    const container = await mount(<AppearanceSettings />);
    await act(async () =>
      setInputValue(sliderFor(container, "Refraction"), "40"),
    );
    expect(html.style.getPropertyValue("--glass-refraction")).toBe("40");

    await act(async () => buttonNamed(container, "Reset to defaults").click());

    expect(html.style.getPropertyValue("--glass-refraction")).toBe("");
    expect(sliderFor(container, "Refraction").value).toBe("30");
  });
});
