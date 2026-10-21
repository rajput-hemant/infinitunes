/**
 * Jest setup for every suite: the build-time web origin, and an in-memory
 * stand-in for native modules without a Jest build (`expo-audio` is mapped
 * in `jest.config.js`).
 */

process.env.EXPO_PUBLIC_API_URL = "https://infinitunes.test";

jest.mock("expo-network", () => ({
  addNetworkStateListener: () => ({ remove: () => {} }),
}));

jest.mock("expo-sqlite/kv-store", () => {
  const items = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => items.get(key) ?? null,
      setItem: async (key: string, value: string) => void items.set(key, value),
      removeItem: async (key: string) => items.delete(key),
    },
  };
});
