/**
 * Jest setup for every suite: the build-time web origin, and an in-memory
 * stand-in for native modules without a Jest build (`expo-audio` is mapped
 * in `jest.config.js`).
 */

process.env.EXPO_PUBLIC_API_URL = "https://infinitunes.test";

// Reanimated's own Jest stand-in (no UI thread here); the bottom sheet and
// the skeleton pulse import it.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// Toasts are asserted through these spies (`jest.mocked(toast.error)`); the
// real Toaster needs Reanimated's native side.
jest.mock("sonner-native", () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    promise: jest.fn(),
  }),
  Toaster: () => null,
}));

jest.mock("expo-network", () => ({
  addNetworkStateListener: () => ({ remove: () => {} }),
}));

jest.mock("expo-sqlite/kv-store", () => {
  const items = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItemSync: (key: string) => items.get(key) ?? null,
      setItemAsync: async (key: string, value: string) =>
        void items.set(key, value),
      removeItemAsync: async (key: string) => items.delete(key),
    },
  };
});
