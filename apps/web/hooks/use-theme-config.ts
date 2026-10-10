"use client";

import { use } from "react";

import { ThemeConfigContext } from "~/lib/theme/provider";
import type { ThemeConfigContextValue } from "~/lib/theme/provider";

/**
 * The appearance config and its setters. `update` changes the page
 * immediately (no reload) and saves in the background.
 */
export function useThemeConfig(): ThemeConfigContextValue {
  const value = use(ThemeConfigContext);
  if (!value)
    throw new Error("useThemeConfig must be used inside <ThemeConfigProvider>");
  return value;
}
