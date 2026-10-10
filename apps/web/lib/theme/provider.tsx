"use client";

import type { ThemeConfig } from "@infinitunes/types";
import {
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  DEFAULT_THEME_CONFIG,
  isDefaultThemeConfig,
  normalizeThemeConfig,
} from "~/lib/theme-config";

import { saveThemeConfig } from "./actions";
import { applyThemeConfig } from "./html";

/** Quiet period before a burst of changes (a slider drag) is persisted. */
const SAVE_DELAY_MS = 300;

export type ThemeConfigContextValue = {
  /** The config on screen: the persisted one plus any change not yet saved. */
  config: ThemeConfig;
  /** Applies a partial change to the page at once and persists it shortly after. */
  update: (patch: Partial<ThemeConfig>) => void;
  /** Restores every field to its default. */
  reset: () => void;
  isDefault: boolean;
  /** A save is in flight. */
  isSaving: boolean;
};

export const ThemeConfigContext = createContext<ThemeConfigContextValue | null>(
  null,
);

type ThemeConfigProviderProps = {
  /** The config the server rendered `<html>` with. */
  initial: ThemeConfig;
  children: React.ReactNode;
};

export function ThemeConfigProvider({
  initial,
  children,
}: ThemeConfigProviderProps) {
  const [config, setConfig] = useState(initial);
  const [isSaving, startSaving] = useTransition();
  const latest = useRef(config);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Runs after every render, not only when `config` changes: a server refresh
  // re-renders `<html>` from the saved cookie and can lag behind a drag in progress.
  useLayoutEffect(() => {
    applyThemeConfig(document.documentElement, config);
  });

  const commit = useCallback((next: ThemeConfig) => {
    latest.current = next;
    setConfig(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startSaving(async () => {
        try {
          await saveThemeConfig(latest.current);
        } catch {
          toast.error(
            "Could not save your appearance. It will reset when you reload.",
          );
        }
      });
    }, SAVE_DELAY_MS);
  }, []);

  const update = useCallback(
    (patch: Partial<ThemeConfig>) =>
      commit(normalizeThemeConfig({ ...latest.current, ...patch })),
    [commit],
  );
  const reset = useCallback(() => commit(DEFAULT_THEME_CONFIG), [commit]);

  return (
    <ThemeConfigContext
      value={{
        config,
        update,
        reset,
        isDefault: isDefaultThemeConfig(config),
        isSaving,
      }}
    >
      {children}
    </ThemeConfigContext>
  );
}
