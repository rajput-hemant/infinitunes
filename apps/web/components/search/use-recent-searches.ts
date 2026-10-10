"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  addRecentSearch,
  parseRecentSearches,
  RECENT_SEARCHES_KEY,
} from "./recent-searches";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(RECENT_SEARCHES_KEY);
  } catch {
    return null;
  }
}
const getServerSnapshot = () => null;

function write(next: string[]) {
  try {
    if (next.length) {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

export function useRecentSearches() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const recent = useMemo(() => parseRecentSearches(raw), [raw]);

  const add = useCallback((query: string) => {
    write(addRecentSearch(parseRecentSearches(getSnapshot()), query));
  }, []);
  const clear = useCallback(() => write([]), []);

  return { recent, add, clear };
}
