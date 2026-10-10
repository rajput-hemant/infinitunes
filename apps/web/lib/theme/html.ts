import type { ThemeConfig } from "@infinitunes/types";

import { DEFAULT_ACCENT_HEX, themes } from "~/config/themes";
import { DEFAULT_THEME_CONFIG, DEFAULT_GLASS_TUNING } from "~/lib/theme-config";

import { accentVariables, deriveAccentTokens } from "./accent";
import { normalizeHex } from "./oklch";

/** The hex behind an accent value: a preset's hex, or the custom hex itself. */
export function resolveAccentHex(accent: string): string {
  const preset = themes.find((theme) => theme.name === accent);
  return preset?.hex ?? normalizeHex(accent) ?? DEFAULT_ACCENT_HEX;
}

type ThemeAttributes = {
  "data-density": ThemeConfig["density"];
  "data-glass": ThemeConfig["glass"];
  "data-ambient": "on" | "off";
  "data-motion": "full" | "reduced";
  "data-font": ThemeConfig["font"];
  "data-heading-font": ThemeConfig["headingFont"];
  "data-glass-variant"?: ThemeConfig["glassTuning"]["variant"];
  "data-glass-accent-tint"?: "true" | "false";
};

/** Every custom property the engine writes on `<html>`; any other stays with the stylesheet. */
const MANAGED_VARIABLES = [
  "--light-primary",
  "--light-primary-foreground",
  "--light-accent",
  "--dark-primary",
  "--dark-primary-foreground",
  "--dark-accent",
  "--radius",
  "--text-scale",
  "--glass-tint",
  "--glass-blur",
  "--glass-refraction",
  "--glass-sat",
  "--glass-spec",
  "--glass-shadow",
  "--ambient",
] as const;
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

  if (config.accent !== DEFAULT_THEME_CONFIG.accent) {
    Object.assign(
      style,
      accentVariables(deriveAccentTokens(resolveAccentHex(config.accent))),
    );
  }
  if (config.radius !== DEFAULT_THEME_CONFIG.radius) {
    style["--radius"] = `${config.radius}rem`;
  }
  if (config.textSize !== DEFAULT_THEME_CONFIG.textSize) {
    style["--text-scale"] = String(config.textSize / 16);
  }

  const g = config.glassTuning;
  if (g.tint !== DEFAULT_GLASS_TUNING.tint)
    style["--glass-tint"] = String(g.tint);
  if (g.blur !== DEFAULT_GLASS_TUNING.blur)
    style["--glass-blur"] = `${g.blur}px`;
  if (g.refraction !== DEFAULT_GLASS_TUNING.refraction)
    style["--glass-refraction"] = String(g.refraction);
  if (g.sat !== DEFAULT_GLASS_TUNING.sat) style["--glass-sat"] = String(g.sat);
  if (g.spec !== DEFAULT_GLASS_TUNING.spec)
    style["--glass-spec"] = String(g.spec);
  if (g.shadow !== DEFAULT_GLASS_TUNING.shadow)
    style["--glass-shadow"] = String(g.shadow);
  if (g.ambientLevel !== DEFAULT_GLASS_TUNING.ambientLevel)
    style["--ambient"] = String(g.ambientLevel);

  const attributes: ThemeAttributes = {
    "data-density": config.density,
    "data-glass": config.glass,
    "data-ambient": config.ambient ? "on" : "off",
    "data-motion": config.reduceMotion ? "reduced" : "full",
    "data-font": config.font,
    "data-heading-font": config.headingFont,
  };

  if (g.variant !== DEFAULT_GLASS_TUNING.variant) {
    attributes["data-glass-variant"] = g.variant;
  }
  if (g.accentTint !== DEFAULT_GLASS_TUNING.accentTint) {
    attributes["data-glass-accent-tint"] = g.accentTint ? "true" : "false";
  }

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
  target.setAttribute("data-glass", attributes["data-glass"]);
  target.setAttribute("data-ambient", attributes["data-ambient"]);
  target.setAttribute("data-motion", attributes["data-motion"]);
  target.setAttribute("data-font", attributes["data-font"]);
  target.setAttribute("data-heading-font", attributes["data-heading-font"]);

  // Set optional attributes
  if (attributes["data-glass-variant"]) {
    target.setAttribute("data-glass-variant", attributes["data-glass-variant"]);
  } else {
    target.removeAttribute("data-glass-variant");
  }

  if (attributes["data-glass-accent-tint"]) {
    target.setAttribute(
      "data-glass-accent-tint",
      attributes["data-glass-accent-tint"],
    );
  } else {
    target.removeAttribute("data-glass-accent-tint");
  }

  for (const name of MANAGED_VARIABLES) {
    const value = style[name];
    if (value === undefined) target.style.removeProperty(name);
    else target.style.setProperty(name, value);
  }
}
