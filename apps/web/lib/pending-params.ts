"use client";

import type { MouseEvent } from "react";
import { useSyncExternalStore } from "react";

/**
 * Query values a click has asked for but the router has not committed yet
 * (`?lang=`). A chip that sets one shows as selected, and `KeyedByParams`
 * shows its skeleton, in the same frame as the click instead of after the
 * navigation resolves. A value clears once the URL agrees, or after
 * `EXPIRY_MS` if the navigation never lands (cancelled, failed).
 */
const pending = new Map<string, string>();
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let snapshot: ReadonlyMap<string, string> = new Map();

const EXPIRY_MS = 6000;

function emit() {
  snapshot = new Map(pending);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPendingParam(name: string, value: string) {
  pending.set(name, value);
  clearTimeout(timers.get(name));
  timers.set(
    name,
    setTimeout(() => clearPendingParam(name), EXPIRY_MS),
  );
  emit();
}

export function clearPendingParam(name: string) {
  clearTimeout(timers.get(name));
  timers.delete(name);
  if (pending.delete(name)) emit();
}

const none: ReadonlyMap<string, string> = new Map();

export function usePendingParams() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => none,
  );
}

/**
 * `onClick` for a chip `Link` that sets `name`: only a plain primary click
 * navigates, so a new-tab, download or prevented click must not claim a value
 * the URL will never reach.
 */
export function pendingOnClick(name: string, value: string) {
  return (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    setPendingParam(name, value);
  };
}
