import type { ThemeConfig } from "@infinitunes/types";

import { THEME_COOKIE, parseThemeConfig } from "~/lib/theme-config";

let cachedRaw: string | undefined;
let cachedConfig: ThemeConfig | undefined;

/**
 * The saved config as the browser holds it. Returns a referentially stable
 * value while the cookie is unchanged, so it can back `useSyncExternalStore`.
 * Browser only: the static root layout has no request to read it from.
 */
export function readStoredThemeConfig(): ThemeConfig {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`),
  );
  let raw: string | undefined;
  try {
    raw = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    raw = undefined;
  }
  if (cachedConfig === undefined || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConfig = parseThemeConfig(raw);
  }
  return cachedConfig;
}
