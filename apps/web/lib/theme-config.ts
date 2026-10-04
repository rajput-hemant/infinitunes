import type { ThemeConfig } from "@infinitunes/types";
import { cookies } from "next/headers";

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme: "default",
  radius: "default",
};

const RADII: readonly unknown[] = ["default", 0, 0.3, 0.5, 0.75, 1.0];

/**
 * Parses the user-controlled `theme-config` cookie. Anything malformed (bad
 * JSON, wrong shape, unknown radius) falls back to the default for that field
 * instead of throwing during render.
 */
export function parseThemeConfig(raw: string | undefined): ThemeConfig {
  if (!raw) return DEFAULT_THEME_CONFIG;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_THEME_CONFIG;
  }

  if (typeof value !== "object" || value === null) return DEFAULT_THEME_CONFIG;

  const { theme, radius } = value as Record<string, unknown>;

  return {
    theme: typeof theme === "string" ? theme : DEFAULT_THEME_CONFIG.theme,
    radius: RADII.includes(radius)
      ? (radius as ThemeConfig["radius"])
      : DEFAULT_THEME_CONFIG.radius,
  };
}

/** Reads and parses the `theme-config` cookie. */
export async function getThemeConfig(): Promise<ThemeConfig> {
  return parseThemeConfig((await cookies()).get("theme-config")?.value);
}
