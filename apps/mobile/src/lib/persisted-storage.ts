import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "zustand/middleware";

/**
 * JSON storage for zustand's `persist` on the app's SQLite key-value store,
 * which survives restarts. Use it for preferences and the restored queue,
 * never for secrets (`expo-secure-store` holds the session).
 */
export function persistedStorage<State>() {
  return createJSONStorage<State>(() => Storage);
}
