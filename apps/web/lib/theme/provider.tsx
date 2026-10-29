"use client";

import type { ThemeConfig } from "@infinitunes/types";
import {
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { toast } from "sonner";

import { DEFAULT_THEME_CONFIG, normalizeThemeConfig } from "~/lib/theme-config";

import { saveThemeConfig } from "./actions";
import { applyThemeConfig } from "./html";
import { readStoredThemeConfig } from "./stored";

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
  /** A change was made in this visit; nothing has been saved before it. */
  changed: boolean;
};

export const ThemeConfigContext = createContext<ThemeConfigContextValue | null>(
  null,
);

type ThemeConfigProviderProps = {
  children: React.ReactNode;
};

const subscribeNever = () => () => {};

/**
 * The root layout is static, so it cannot know the saved config. Before first
 * paint `lib/theme-script.ts` already applied it to `<html>`; this provider
 * reads the same cookie in the browser for the settings UI (`null` during
 * server render and hydration) and only writes to `<html>` once it knows the
 * config, so it never clobbers the pre-paint values with defaults.
 */
export function ThemeConfigProvider({ children }: ThemeConfigProviderProps) {
  const stored = useSyncExternalStore(
    subscribeNever,
    readStoredThemeConfig,
    () => null,
  );
  const [draft, setDraft] = useState<ThemeConfig | null>(null);
  const [isSaving, startSaving] = useTransition();
  const resolved = draft ?? stored;
  const config = resolved ?? DEFAULT_THEME_CONFIG;
  const latest = useRef<ThemeConfig | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Also repairs a cookie saved before it carried the pre-paint `html` field.
  useLayoutEffect(() => {
    if (resolved) applyThemeConfig(document.documentElement, resolved);
  }, [resolved]);

  const commit = useCallback((next: ThemeConfig) => {
    // All inputs are normalized, including key order, before they reach here.
    if (
      JSON.stringify(next) ===
      JSON.stringify(latest.current ?? readStoredThemeConfig())
    )
      return;
    latest.current = next;
    setDraft(next);
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
      commit(
        normalizeThemeConfig({
          ...(latest.current ?? readStoredThemeConfig()),
          ...patch,
        }),
      ),
    [commit],
  );
  const reset = useCallback(() => commit(DEFAULT_THEME_CONFIG), [commit]);

  return (
    <ThemeConfigContext
      value={{
        config,
        update,
        reset,
        isDefault:
          JSON.stringify(config) === JSON.stringify(DEFAULT_THEME_CONFIG),
        isSaving,
        changed: draft !== null,
      }}
    >
      {children}
    </ThemeConfigContext>
  );
}
