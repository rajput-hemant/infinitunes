import type { ExpoClientStorage } from "@better-auth/expo/client";

/**
 * A write-through, in-memory copy of a secure store. Every Keychain/Keystore
 * read is a native round trip, and the session cookie is read for every tRPC
 * request and every play. All writes go through this wrapper (Better Auth
 * stores sign-in, rotation and sign-out here), so the copy never goes stale.
 * A missing key is not cached.
 */
export function cachedStorage(storage: ExpoClientStorage): ExpoClientStorage {
  const cache = new Map<string, string>();
  // Bumped on every write: a read that started before one must not fill the
  // cache with the value it saw.
  const writes = new Map<string, number>();
  const bump = (key: string) => writes.set(key, (writes.get(key) ?? 0) + 1);

  return {
    getItem(key) {
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const value = storage.getItem(key);
      if (value !== null) cache.set(key, value);
      return value;
    },
    async getItemAsync(key) {
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const version = writes.get(key) ?? 0;
      const value = await storage.getItemAsync(key);
      if (value !== null && (writes.get(key) ?? 0) === version) {
        cache.set(key, value);
      }
      return value;
    },
    setItem(key, value, options) {
      bump(key);
      storage.setItem(key, value, options);
      cache.set(key, value);
    },
    async setItemAsync(key, value, options) {
      bump(key);
      cache.delete(key);
      await storage.setItemAsync(key, value, options);
      bump(key);
      cache.set(key, value);
    },
  };
}
