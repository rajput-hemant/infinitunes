import { afterEach, describe, expect, it } from "bun:test";

import { resolveStyle, specificity } from "./glass-cascade";

const html = document.documentElement;

type Scenario = {
  htmlAttrs?: Record<string, string>;
  surface: Record<string, string>;
  overArt?: boolean;
};

function build({ htmlAttrs = {}, surface, overArt = false }: Scenario) {
  for (const [name, value] of Object.entries(htmlAttrs)) {
    html.setAttribute(name, value);
  }
  const host = document.createElement("div");
  if (overArt) host.setAttribute("data-glass-over-art", "");
  const el = document.createElement("div");
  for (const [name, value] of Object.entries(surface)) {
    el.setAttribute(name, value);
  }
  host.append(el);
  document.body.append(host);
  return el;
}

afterEach(() => {
  for (const name of [...html.getAttributeNames()]) html.removeAttribute(name);
  document.body.replaceChildren();
});

const regular = { "data-glass": "regular", "data-glass-size": "s" };

// Every way a surface can be turned into the clear or tinted variant.
const variantScenarios: Record<string, Scenario> = {
  "explicit clear": { surface: { ...regular, "data-glass": "clear" } },
  "variant setting clear": {
    htmlAttrs: { "data-glass-variant": "clear" },
    surface: regular,
  },
  "toolbar over artwork": { overArt: true, surface: regular },
  "variant setting tinted": {
    htmlAttrs: { "data-glass-variant": "tinted" },
    surface: regular,
  },
  "explicit tinted": { surface: { ...regular, "data-glass": "tinted" } },
};

describe("specificity helper", () => {
  it("counts attributes, :is and :not by their widest argument", () => {
    expect(specificity("html [data-glass-over-art]:not([a]) [b][c]")).toEqual([
      0, 4, 1,
    ]);
    expect(specificity("html :is([a][b], [c])")).toEqual([0, 2, 1]);
    expect(specificity("html:where(.x) [a]")).toEqual([0, 1, 1]);
  });
});

describe("glass.css precedence", () => {
  it("keeps the mockup look by default: over-art toolbars read as clear", () => {
    const el = build(variantScenarios["toolbar over artwork"] as Scenario);
    const style = resolveStyle(el);
    expect(style.get("--g-text")).toBe("#fff");
    expect(style.get("--g-a")).toBe("0.06");
  });

  it("drops the clear look once the title has scrolled into the bar", () => {
    const el = build({
      overArt: true,
      surface: { ...regular },
    });
    el.parentElement?.setAttribute("data-glass-titled", "");
    expect(resolveStyle(el).get("--g-text")).not.toBe("#fff");
  });

  for (const [name, scenario] of Object.entries(variantScenarios)) {
    it(`Solid level wins over ${name}`, () => {
      const el = build({
        ...scenario,
        htmlAttrs: { ...scenario.htmlAttrs, "data-glass-level": "solid" },
      });
      const style = resolveStyle(el);
      expect(style.get("--g-a")).toBe("1");
      expect(style.get("--g-dim")).toBe("0");
      expect(style.get("backdrop-filter")).toBe("none");
      expect(style.get("text-shadow")).toBe("none");
      // Tinted keeps its accent glyphs; everything else returns to foreground.
      const tinted = scenario.surface["data-glass"] === "tinted";
      expect(style.get("--g-text")).toBe(
        tinted ? "var(--g-on-accent)" : "var(--g-fg)",
      );
    });

    it(`prefers-contrast: more wins over ${name}`, () => {
      const el = build(scenario);
      const style = resolveStyle(el, ["prefers-contrast: more"]);
      expect(style.get("--g-a")).toBe("0.97");
      expect(style.get("--g-dim")).toBe("0");
      expect(style.get("backdrop-filter")).toBe("none");
      expect(style.get("text-shadow")).toBe("none");
      const tinted = scenario.surface["data-glass"] === "tinted";
      expect(style.get("--g-text")).toBe(
        tinted ? "var(--g-on-accent)" : "var(--g-fg)",
      );
    });
  }

  it("prefers-reduced-transparency dims every clear route the same way", () => {
    for (const name of [
      "explicit clear",
      "variant setting clear",
      "toolbar over artwork",
    ]) {
      const el = build(variantScenarios[name] as Scenario);
      const style = resolveStyle(el, ["prefers-reduced-transparency: reduce"]);
      expect(style.get("--g-dim")).toBe("0.62");
      expect(style.get("--g-a")).toBe("0.04");
      document.body.replaceChildren();
      for (const attr of [...html.getAttributeNames()]) {
        html.removeAttribute(attr);
      }
    }
  });
});

describe("minimized phone tab bar", () => {
  const phone = ["max-width: 767px"];

  function bar() {
    html.setAttribute("data-tab-min", "true");
    const nav = document.createElement("nav");
    nav.setAttribute("data-glass-role", "tabbar");
    const items = ["Home", "Search"].map((label) => {
      const item = document.createElement("a");
      item.setAttribute("data-glass-item", "");
      item.textContent = label;
      nav.append(item);
      return item;
    });
    items[0]?.setAttribute("aria-current", "page");
    document.body.append(nav);
    return items;
  }

  it("hides the other tabs from focus and assistive tech, keeping the current one", () => {
    const [current, other] = bar();
    if (!current || !other) throw new Error("tabs missing");
    expect(resolveStyle(other, phone).get("visibility")).toBe("hidden");
    expect(resolveStyle(current, phone).has("visibility")).toBe(false);
  });

  it("shows every tab again once expanded", () => {
    const [, other] = bar();
    if (!other) throw new Error("tabs missing");
    html.removeAttribute("data-tab-min");
    expect(resolveStyle(other, phone).has("visibility")).toBe(false);
  });
});
