/**
 * What the appearance engine is allowed to write on `<html>`. A leaf module so the
 * pre-paint script (`lib/theme-script.ts`) can embed the same lists that
 * `themeConfigToHtml` emits from, without pulling in the theme derivation code.
 */

/** Every `data-*` attribute `themeConfigToHtml` can emit. */
export const MANAGED_ATTRIBUTES = [
  "data-density",
  "data-glass-level",
  "data-ambient",
  "data-motion",
  "data-font",
  "data-heading-font",
  "data-glass-variant",
  "data-glass-accent-tint",
] as const;

/** Every custom property the engine writes on `<html>`; any other stays with the stylesheet. */
export const MANAGED_VARIABLES = [
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
