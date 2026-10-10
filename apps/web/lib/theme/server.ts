import type { ThemeConfig } from "@infinitunes/types";
import { cookies } from "next/headers";

import { THEME_COOKIE, parseThemeConfig } from "~/lib/theme-config";

/** The visitor's config, read from the cookie on the server. Reading it makes the route dynamic. */
export async function getThemeConfig(): Promise<ThemeConfig> {
  return parseThemeConfig((await cookies()).get(THEME_COOKIE)?.value);
}
