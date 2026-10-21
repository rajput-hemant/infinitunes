import { useEffect, useSyncExternalStore } from "react";

/**
 * Shared optimistic like state. Every heart for the same item (row, header,
 * player, tile menu) reads the same entry, so a click flips them all in the
 * same frame instead of only the button that was pressed.
 *
 * `want` is what the UI shows, `confirmed` is the last state the server
 * accepted. Clicks only move `want`; one request per key is in flight and it
 * always sends the latest intent, so rapid clicks never race or double toggle.
 * A failed request puts `want` back to `confirmed`. The entry stays until the
 * refreshed server props agree with it (`useFavorite` clears it), so the heart
 * never flickers back to the stale prop between the action and the refresh.
 */
type Entry = {
  want: boolean;
  confirmed: boolean;
  busy: boolean;
  expiry?: ReturnType<typeof setTimeout>;
};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();

// Safety net if a refresh never delivers matching props (e.g. another tab).
const EXPIRY_MS = 8000;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function favoriteKey(type: string, token: string) {
  return `${type}:${token}`;
}

async function drain(key: string, entry: Entry, send: Send) {
  entry.busy = true;
  // A new write supersedes the safety timer of the previous one.
  clearTimeout(entry.expiry);
  while (entry.want !== entry.confirmed) {
    const target = entry.want;
    try {
      await send(target);
      entry.confirmed = target;
    } catch {
      entry.want = entry.confirmed;
      emit();
      break;
    }
  }
  entry.busy = false;
  emit();
  entry.expiry = setTimeout(() => {
    if (entries.get(key) === entry && !entry.busy) {
      entries.delete(key);
      emit();
    }
  }, EXPIRY_MS);
}

type Send = (liked: boolean) => Promise<unknown>;

type ToggleOptions = {
  key: string;
  /** What the server props say right now; the base for a first toggle. */
  serverLiked: boolean;
  /** Persists the new state; reject to roll back. Reports its own errors. */
  send: Send;
};

/** Flips the shown state at once and persists the latest intent. */
export function toggleFavorite({ key, serverLiked, send }: ToggleOptions) {
  let entry = entries.get(key);
  if (!entry) {
    entry = { want: serverLiked, confirmed: serverLiked, busy: false };
    entries.set(key, entry);
  }
  entry.want = !entry.want;
  emit();
  if (!entry.busy) void drain(key, entry, send);
}

/** The state to show: the pending intent if there is one, else the server's. */
export function useFavorite(key: string, serverLiked: boolean) {
  // One primitive: -1 none, else bit 0 is `want` and bit 1 is "settled".
  const code = useSyncExternalStore(
    subscribe,
    () => {
      const entry = entries.get(key);
      return entry ? (entry.want ? 1 : 0) + (entry.busy ? 0 : 2) : -1;
    },
    () => -1,
  );

  useEffect(() => {
    // Settled (bit 1) and agreeing with the server's props: nothing left to show.
    if (code >= 2 && ((code & 1) === 1) === serverLiked) {
      clearTimeout(entries.get(key)?.expiry);
      entries.delete(key);
      emit();
    }
  }, [key, serverLiked, code]);

  return code === -1 ? serverLiked : (code & 1) === 1;
}

/** Test hook: forget every pending entry. */
export function resetFavoriteOverlay() {
  for (const entry of entries.values()) clearTimeout(entry.expiry);
  entries.clear();
  emit();
}
