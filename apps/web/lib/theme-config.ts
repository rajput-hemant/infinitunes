import type { ThemeConfig } from "@infinitunes/types";
import { cookies } from "next/headers";

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme: "default",
  radius: "default",
};

/** Reads the `theme-config` cookie; a missing or malformed cookie yields the default. */
export async function getThemeConfig(): Promise<ThemeConfig> {
  const cookie = (await cookies()).get("theme-config");
  if (!cookie) return DEFAULT_THEME_CONFIG;

  try {
    return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(cookie.value) };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}
