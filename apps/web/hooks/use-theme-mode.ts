"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";

import { switchThemeMode } from "~/lib/theme/mode";

/** The saved colour mode, and a setter that repaints in the same frame as the click. */
export function useThemeMode() {
  const { theme, setTheme } = useTheme();
  const setMode = useCallback(
    (mode: string) => switchThemeMode(mode, setTheme),
    [setTheme],
  );
  return { theme, setMode };
}
