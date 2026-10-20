import React from "react";

/**
 * Playhead position kept outside React state, so the per-frame updates only
 * re-render the components that subscribe (seek bar, time labels) and not the
 * whole player (PF-8).
 */
export type PositionStore = {
  get: () => number;
  set: (value: number) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createPositionStore(initial = 0): PositionStore {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export function usePosition(store: PositionStore) {
  return React.useSyncExternalStore(store.subscribe, store.get, store.get);
}
