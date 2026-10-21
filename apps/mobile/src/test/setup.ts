/**
 * Jest setup for every suite: the build-time web origin, Reanimated's Jest
 * mode (its modules resolve through `src/test/resolver.js`), the app's two
 * network clients swapped for scriptable fakes (`~/test/trpc-mock`,
 * `~/test/session-mock`), and in-memory stand-ins for native modules without
 * a Jest build (`expo-audio` is mapped in `jest.config.js`).
 */
import { setUpTests } from "react-native-reanimated";

process.env.EXPO_PUBLIC_API_URL = "https://infinitunes.test";

setUpTests();

jest.mock("~/lib/trpc", () => require("~/test/trpc-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () =>
  require("~/test/swipeable"),
);
jest.mock("react-native-reorderable-list", () =>
  require("~/test/reorderable-list"),
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
