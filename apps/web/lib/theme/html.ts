import type { ThemeConfig } from "@infinitunes/types";

import { DEFAULT_THEME_CONFIG, DEFAULT_GLASS_TUNING } from "~/lib/theme-config";

import { accentVariables, deriveAccentTokens } from "./accent";
import { MANAGED_VARIABLES } from "./managed";

/** Keys must stay within `MANAGED_ATTRIBUTES` (the pre-paint script only accepts those). */
type ThemeAttributes = {
  "data-density": ThemeConfig["density"];
  "data-glass-level": ThemeConfig["glass"];
  "data-motion": "full" | "reduced";
  "data-font": ThemeConfig["font"];
  "data-heading-font": ThemeConfig["headingFont"];
  /** Present while the glass tint layer is on, so it costs nothing when it is not. */
  "data-glass-tint"?: "on";
};

type ManagedVariable = (typeof MANAGED_VARIABLES)[number];

export type ThemeHtml = {
  attributes: ThemeAttributes;
  /** Only variables whose value differs from the stylesheet default. */
  style: Partial<Record<ManagedVariable, string>>;
};

/**
 * The `<html>` attributes and inline custom properties for a config. The root
 * layout renders them on the server, so first paint is already themed, and
 * `applyThemeConfig` writes the same values on the client for live changes.
 */
export function themeConfigToHtml(config: ThemeConfig): ThemeHtml {
  const style: ThemeHtml["style"] = {};

  if (config.radius !== DEFAULT_THEME_CONFIG.radius) {
    style["--radius"] = `${config.radius}rem`;
  }
  if (config.textSize !== DEFAULT_THEME_CONFIG.textSize) {
    style["--text-scale"] = String(config.textSize / 16);
  }

  const g = config.glassTuning;
  const d = DEFAULT_GLASS_TUNING;
  if (g.depth !== d.depth) style["--glass-depth"] = String(g.depth);
  if (g.splay !== d.splay) style["--glass-splay"] = String(g.splay);
  if (g.feather !== d.feather) style["--glass-feather"] = String(g.feather);
  if (g.curve !== d.curve) style["--glass-curve"] = String(g.curve);
  if (g.blur !== d.blur) style["--glass-blur"] = `${g.blur}px`;
  if (g.chroma !== d.chroma) style["--glass-chroma"] = String(g.chroma);
  if (g.glint !== d.glint) style["--glass-glint"] = String(g.glint / 100);
  if (g.tint !== d.tint) style["--glass-tint"] = String(g.tint);
  if (g.tintColor !== d.tintColor) style["--glass-tint-c"] = g.tintColor;
  // The accent is the tint: with the layer on, primary derives from its colour.
  if (g.tint > 0) {
    Object.assign(style, accentVariables(deriveAccentTokens(g.tintColor)));
  }

  const attributes: ThemeAttributes = {
    "data-density": config.density,
    "data-glass-level": config.glass,
    "data-motion": config.reduceMotion ? "reduced" : "full",
    "data-font": config.font,
    "data-heading-font": config.headingFont,
  };
  if (g.tint > 0) attributes["data-glass-tint"] = "on";

  return { attributes, style };
}

/** The slice of `HTMLElement` the applier needs, so it runs against a fake in tests. */
export type ThemeTarget = {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  style: {
    setProperty(name: string, value: string): void;
    removeProperty(name: string): string;
  };
};

/** Applies a config to `document.documentElement` without a re-render. */
export function applyThemeConfig(target: ThemeTarget, config: ThemeConfig) {
  const { attributes, style } = themeConfigToHtml(config);

  // Set required attributes
  target.setAttribute("data-density", attributes["data-density"]);
  target.setAttribute("data-glass-level", attributes["data-glass-level"]);
  // Cookies written before the rename carry `data-glass`; on `<html>` it would
  // read as a glass surface, so drop it.
  target.removeAttribute("data-glass");
  target.setAttribute("data-motion", attributes["data-motion"]);
  target.setAttribute("data-font", attributes["data-font"]);
  target.setAttribute("data-heading-font", attributes["data-heading-font"]);

  if (attributes["data-glass-tint"]) {
    target.setAttribute("data-glass-tint", attributes["data-glass-tint"]);
  } else {
    target.removeAttribute("data-glass-tint");
  }

  for (const name of MANAGED_VARIABLES) {
    const value = style[name];
    if (value === undefined) target.style.removeProperty(name);
    else target.style.setProperty(name, value);
  }
}
