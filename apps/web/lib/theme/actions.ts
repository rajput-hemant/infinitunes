"use server";

import { cookies } from "next/headers";

import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  isDefaultThemeConfig,
  normalizeThemeConfig,
} from "~/lib/theme-config";

import { serializeThemeCookie } from "./cookie";

/**
 * Persists the appearance config. The argument is untrusted, so it is
 * normalized before anything is stored; the default config clears the cookie.
 */
export async function saveThemeConfig(input: unknown): Promise<void> {
  const config = normalizeThemeConfig(input);
  const store = await cookies();

  if (isDefaultThemeConfig(config)) {
    store.delete(THEME_COOKIE);
    return;
  }

  store.set(THEME_COOKIE, serializeThemeCookie(config), {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    // Not httpOnly: the pre-paint script and the client provider read it.
    // It holds only appearance preferences.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
