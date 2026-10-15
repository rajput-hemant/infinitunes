import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { ThemeConfig } from "@infinitunes/types";
import { ThemeProvider } from "next-themes";
import { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { setInputValue } from "./set-input-value";

const saved: ThemeConfig[] = [];

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async (input: ThemeConfig) => {
    saved.push(input);
  },
}));

const { AppearanceSettings, ResetAppearanceButton } =
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

/** Expands the collapsed "Fine-tune the lens" group, which holds the rim sliders. */
async function openFineTune(container: HTMLElement) {
  const toggle = container.querySelector(
    "button[aria-label='Fine-tune the lens']",
  );
  if (!(toggle instanceof HTMLButtonElement)) throw new Error("No lens toggle");
  if (toggle.getAttribute("aria-expanded") === "true") return;
  await act(async () => toggle.click());
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

function sliderForColor(container: HTMLElement) {
  const input = container.querySelector("input[type=color]");
  if (!(input instanceof HTMLInputElement)) throw new Error("No tint colour");
  return input;
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
  it("hydrates a saved dark theme without a mismatch", async () => {
    localStorage.setItem("theme", "dark");
    const tree = (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ThemeConfigProvider>
          <LiquidGlassSettings />
        </ThemeConfigProvider>
      </ThemeProvider>
    );
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(tree);
    expect(outputFor(container, "Blur")?.textContent).toBe("2.00");

    const recoverable: unknown[] = [];
    const errors: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      await act(async () => {
        mounted.push(
          hydrateRoot(container, tree, {
            onRecoverableError: (error) => recoverable.push(error),
          }),
        );
      });
    } finally {
      console.error = original;
      localStorage.removeItem("theme");
    }

    expect(recoverable).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("shows the pen's controls with its ranges and defaults", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);
    const expected: [string, string, string, string, string][] = [
      ["Depth", "0", "120", "1", "60"],
      ["Splay", "2", "40", "1", "2"],
      ["Feather", "0", "40", "1", "24"],
      ["Curvature", "0.3", "3", "0.1", "2.0"],
      ["Blur", "0", "5", "0.01", "2.00"],
      ["Chromatic", "0", "0.25", "0.01", "0.00"],
      ["Glint", "0", "150", "5", "25"],
      ["Tint", "0", "1", "0.01", "0.00"],
    ];
    for (const [label, min, max, step, shown] of expected) {
      const slider = sliderFor(container, label);
      expect([slider.min, slider.max, slider.step]).toEqual([min, max, step]);
      expect(outputFor(container, label)?.textContent).toBe(shown);
    }
    const color = sliderForColor(container);
    expect(color.value).toBe("#ffffff");
  });

  it("starts with the lens fine-tune collapsed and opens it on demand", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const toggle = container.querySelector(
      "button[aria-label='Fine-tune the lens']",
    );
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("input[type=range]")).not.toBeNull();
    expect(() => sliderFor(container, "Depth")).toThrow();
    // Tint and Blur stay in view; only the rim sliders are folded away.
    expect(sliderFor(container, "Tint")).toBeDefined();

    await openFineTune(container);

    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(sliderFor(container, "Depth").value).toBe("60");
  });

  it("moves the depth slider live and saves only that key", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);

    await act(async () => setInputValue(sliderFor(container, "Depth"), "90"));

    expect(html.style.getPropertyValue("--glass-depth")).toBe("90");
    expect(sliderFor(container, "Depth").value).toBe("90");
    expect(outputFor(container, "Depth")?.textContent).toBe("90");
    const config = await settleSave();
    expect(config?.glassTuning.depth).toBe(90);
    expect(config?.glassTuning.splay).toBe(
      DEFAULT_THEME_CONFIG.glassTuning.splay,
    );
  });

  it("writes blur in px, glint as a share of 1 and the rim shape as plain numbers", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);

    await act(async () => setInputValue(sliderFor(container, "Blur"), "2.5"));
    await act(async () => setInputValue(sliderFor(container, "Glint"), "80"));
    await act(async () => setInputValue(sliderFor(container, "Splay"), "12"));
    await act(async () =>
      setInputValue(sliderFor(container, "Chromatic"), "0.1"),
    );

    expect(html.style.getPropertyValue("--glass-blur")).toBe("2.5px");
    expect(html.style.getPropertyValue("--glass-glint")).toBe("0.8");
    expect(html.style.getPropertyValue("--glass-splay")).toBe("12");
    expect(html.style.getPropertyValue("--glass-chroma")).toBe("0.1");
  });

  it("applies a preset in one step and marks it selected", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);
    expect(radio(container, "Glass preset", "simple").checked).toBe(true);

    await act(async () => radio(container, "Glass preset", "frosted").click());

    expect(radio(container, "Glass preset", "frosted").checked).toBe(true);
    expect(html.style.getPropertyValue("--glass-depth")).toBe("120");
    expect(html.style.getPropertyValue("--glass-blur")).toBe("5px");
    expect(sliderFor(container, "Splay").value).toBe("16");
    const config = await settleSave();
    expect(config?.glassTuning).toMatchObject({
      depth: 120,
      splay: 16,
      feather: 26,
      curve: 2.6,
      blur: 5,
      glint: 20,
    });
  });

  it("the orange plexiglass preset turns the tint on and the primary follows it", async () => {
    const container = await mount(<LiquidGlassSettings />);
    expect(html.hasAttribute("data-glass-tint")).toBe(false);

    await act(async () => radio(container, "Glass preset", "plexi").click());

    expect(html.getAttribute("data-glass-tint")).toBe("on");
    expect(html.style.getPropertyValue("--glass-tint-c")).toBe("#ff6600");
    expect(html.style.getPropertyValue("--light-primary")).toMatch(/^oklch/);
    expect(sliderForColor(container).value).toBe("#ff6600");
  });

  it("deselects the presets once a slider moves off one", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);
    await act(async () => radio(container, "Glass preset", "thick").click());
    await act(async () => setInputValue(sliderFor(container, "Depth"), "100"));
    for (const id of ["simple", "thick", "frosted", "cut", "plexi"]) {
      expect(radio(container, "Glass preset", id).checked).toBe(false);
    }
  });

  it("takes the tint colour from the colour input", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await act(async () => setInputValue(sliderFor(container, "Tint"), "0.5"));
    await act(async () => setInputValue(sliderForColor(container), "#2563eb"));
    expect(html.style.getPropertyValue("--glass-tint-c")).toBe("#2563eb");
    const config = await settleSave();
    expect(config?.glassTuning.tintColor).toBe("#2563eb");
    expect(config?.glassTuning.tint).toBe(0.5);
  });

  it("dims the tuning controls while the glass level is solid", async () => {
    const container = await mount(<LiquidGlassSettings />);
    const fieldset = container.querySelector("fieldset");
    expect(fieldset?.disabled).toBe(false);

    await act(async () => radio(container, "Glass level", "solid").click());

    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });

  it("reset glass restores the tuning defaults", async () => {
    const container = await mount(<LiquidGlassSettings />);
    await openFineTune(container);
    expect(buttonNamed(container, "Reset glass").disabled).toBe(true);
    await act(async () => radio(container, "Glass preset", "plexi").click());
    expect(buttonNamed(container, "Reset glass").disabled).toBe(false);

    await act(async () => buttonNamed(container, "Reset glass").click());

    expect(html.style.getPropertyValue("--glass-blur")).toBe("");
    expect(html.hasAttribute("data-glass-tint")).toBe(false);
    expect(sliderFor(container, "Depth").value).toBe("60");
    expect(radio(container, "Glass preset", "simple").checked).toBe(true);
    expect(buttonNamed(container, "Reset glass").disabled).toBe(true);
  });

  it("no longer offers an accent colour or an ambient switch", async () => {
    const container = await mount(<AppearanceSettings />);
    expect(container.textContent).not.toContain("Accent");
    expect(container.textContent).not.toContain("Ambient");
  });

  it("page reset restores the glass tuning with everything else", async () => {
    const container = await mount(
      <>
        <AppearanceSettings />
        <ResetAppearanceButton />
      </>,
    );
    await openFineTune(container);
    await act(async () => setInputValue(sliderFor(container, "Depth"), "100"));
    expect(html.style.getPropertyValue("--glass-depth")).toBe("100");

    await act(async () => buttonNamed(container, "Reset to defaults").click());

    expect(html.style.getPropertyValue("--glass-depth")).toBe("");
    expect(sliderFor(container, "Depth").value).toBe("60");
  });
});
