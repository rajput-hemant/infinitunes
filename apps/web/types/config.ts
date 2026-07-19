import type { Theme } from "~/config/themes";

export type ThemeConfig = {
  theme: Theme["name"] | "default";
  radius: 0 | 0.3 | 0.5 | 0.75 | 1.0 | "default";
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme: "default",
  radius: "default",
};
