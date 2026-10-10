import type { ThemeConfig } from "@infinitunes/types";

import { DEFAULT_ACCENT_HEX, themes } from "~/config/themes";
import { DEFAULT_THEME_CONFIG } from "~/lib/theme-config";

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

  return {
    attributes: {
      "data-density": config.density,
      "data-glass": config.glass,
      "data-ambient": config.ambient ? "on" : "off",
      "data-motion": config.reduceMotion ? "reduced" : "full",
      "data-font": config.font,
      "data-heading-font": config.headingFont,
    },
    style,
  };
}

/** The slice of `HTMLElement` the applier needs, so it runs against a fake in tests. */
export type ThemeTarget = {
  setAttribute(name: string, value: string): void;
  style: {
    setProperty(name: string, value: string): void;
    removeProperty(name: string): string;
  };
};

/** Applies a config to `document.documentElement` without a re-render. */
export function applyThemeConfig(target: ThemeTarget, config: ThemeConfig) {
  const { attributes, style } = themeConfigToHtml(config);
  for (const [name, value] of Object.entries(attributes)) {
    target.setAttribute(name, value);
  }
  for (const name of MANAGED_VARIABLES) {
    const value = style[name];
    if (value === undefined) target.style.removeProperty(name);
    else target.style.setProperty(name, value);
  }
}
