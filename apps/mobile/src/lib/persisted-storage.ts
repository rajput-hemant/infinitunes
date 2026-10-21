import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "zustand/middleware";

/**
 * JSON storage for zustand's `persist` on the app's SQLite key-value store,
 * which survives restarts. Use it for preferences and the restored queue,
 * never for secrets (`expo-secure-store` holds the session).
 *
 * Reads are synchronous, so a store is hydrated as it is created: the first
 * render already shows the restored queue, and a tap at launch cannot be
 * overwritten by a hydration that lands after it. Writes stay asynchronous.
 */
export function persistedStorage<State>() {
  return createJSONStorage<State>(() => ({
    getItem: (key) => Storage.getItemSync(key),
    setItem: (key, value) => Storage.setItemAsync(key, value),
    removeItem: (key) => Storage.removeItemAsync(key),
  }));
}
