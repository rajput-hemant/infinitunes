import { useEffect, useState } from "react";

type DebouncedValueOptions<T> = {
  /** A value that is returned at once instead of waiting out the delay. */
  immediate?: T;
};

/**
 * `value`, trailing by `delayMs` after the last change. The caller keeps its own
 * state for the input, so typing stays instant; only the derived work (a
 * network query) waits for a pause. A value equal to `immediate` (an emptied
 * field) skips the wait so stale results never linger.
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs: number,
  { immediate }: DebouncedValueOptions<T> = {},
): T {
  const [settled, setSettled] = useState(value);
  const skipWait = immediate !== undefined && value === immediate;
  if (skipWait && !Object.is(settled, value)) setSettled(value);

  useEffect(() => {
    if (skipWait) return;
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, skipWait]);

  return skipWait ? value : settled;
}

/** Idle time before a search field's text becomes a query. */
export const SEARCH_DEBOUNCE_MS = 225;
