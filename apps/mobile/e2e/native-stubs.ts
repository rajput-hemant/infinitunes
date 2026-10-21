/**
 * Stand-ins for the native modules the app's auth and tRPC clients import,
 * so the real client code runs under Bun against a real server. Everything
 * else (Better Auth's expo client, expo-linking's `createURL`, tRPC) is the
 * app's own dependency, unmodified.
 */
import { mock } from "bun:test";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The web app under test (`MOBILE_E2E_API_URL`). The suites create accounts
 * and data, so only a local server is accepted. Unset, the suites skip and
 * this placeholder is never contacted.
 */
export const E2E_API_URL = (() => {
  const value = process.env.MOBILE_E2E_API_URL;
  if (!value) return "http://127.0.0.1:9";
  const url = new URL(value);
  if (!LOOPBACK.has(url.hostname)) {
    throw new Error(
      `MOBILE_E2E_API_URL must be a local server (it creates accounts), got ${url.host}`,
    );
  }
  return url.origin;
})();
process.env.EXPO_PUBLIC_API_URL = E2E_API_URL;

/** expo-constants: what a build reports. Mutable so a test can be a dev client. */
export const constants: {
  executionEnvironment: string;
  expoConfig: { scheme: string; hostUri?: string };
  expoGoConfig?: unknown;
} = {
  executionEnvironment: "bare",
  expoConfig: { scheme: "infinitunes" },
};

/** A keychain: synchronous and async reads and writes, like expo-secure-store. */
export function createSecureStore() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    getItemAsync: async (key: string) => items.get(key) ?? null,
    setItemAsync: async (key: string, value: string) =>
      void items.set(key, value),
    deleteItemAsync: async (key: string) => void items.delete(key),
  };
}

export const secureStore = createSecureStore();

const platform = {
  OS: "ios",
  Version: "26.0",
  select: <T>(spec: { ios?: T; native?: T; default?: T }) =>
    spec.ios ?? spec.native ?? spec.default,
};

const noSubscription = { remove() {} };

let installed = false;

/** Once per process: `bun test` runs every suite file in one. */
export function installNativeStubs() {
  if (installed) return;
  installed = true;
  // A release build: expo-linking reads the global.
  Reflect.set(globalThis, "__DEV__", false);
  mock.module("react-native", () => ({
    Platform: platform,
    AppState: {
      currentState: "active",
      addEventListener: () => noSubscription,
    },
  }));
  mock.module("expo-modules-core", () => ({ Platform: platform }));
  mock.module("expo-constants", () => ({
    default: constants,
    ExecutionEnvironment: {
      Bare: "bare",
      Standalone: "standalone",
      StoreClient: "storeClient",
    },
  }));
  mock.module("expo/internal/bundle-origin", () => ({
    getBundleOrigin: () => null,
  }));
  // The real `createURL`; the rest of expo-linking binds native modules.
  mock.module("expo-linking", async () => {
    const { createURL } =
      await import("../node_modules/expo-linking/build/createURL.js");
    return { createURL };
  });
  mock.module("expo-secure-store", () => secureStore);
  mock.module("expo-network", () => ({
    addNetworkStateListener: () => noSubscription,
  }));
}
