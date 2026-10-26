/**
 * Jest setup for every suite: the build-time web origin, Reanimated's Jest
 * mode (its modules resolve through `src/test/resolver.js`), the app's two
 * network clients swapped for scriptable fakes (`~/test/trpc-mock`,
 * `~/test/session-mock`), and in-memory stand-ins for native modules without
 * a Jest build (`expo-audio` is mapped in `jest.config.js`).
 */
import { Dimensions } from "react-native";
import { setUpTests } from "react-native-reanimated";

process.env.EXPO_PUBLIC_API_URL = "https://infinitunes.test";
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "web.apps.googleusercontent.com";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "ios.apps.googleusercontent.com";

setUpTests();

// The default window is a phone in portrait (the React Native preset's is
// 750pt wide, a `medium` window), so screens render their compact layouts;
// a suite that needs a wider window sets its own with `Dimensions.set`.
const phone = { ...Dimensions.get("window"), width: 390, height: 844 };
Dimensions.set({ window: phone, screen: phone });

jest.mock("expo-file-system", () => require("~/test/expo-file-system"));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));
// Haptics have no engine under Jest; suites assert on the calls.
jest.mock("expo-haptics", () => ({
  AndroidHaptics: {
    Virtual_Key: "virtual-key",
    Segment_Tick: "segment-tick",
    Toggle_On: "toggle-on",
    Toggle_Off: "toggle-off",
    Confirm: "confirm",
    Reject: "reject",
    Long_Press: "long-press",
    Gesture_Start: "gesture-start",
  },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Rigid: "rigid" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("~/lib/trpc", () => require("~/test/trpc-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock(
  "expo-apple-authentication",
  () => require("~/test/native-auth").appleAuthentication,
);
jest.mock(
  "@react-native-google-signin/google-signin",
  () => require("~/test/native-auth").googleSignIn,
);
jest.mock("react-native-passkey", () => require("~/test/native-auth").passkey);
// The v3 gesture hooks load Gesture Handler's Reanimated wrapper, which asks
// Worklets for the UI runtime on an immediate: Jest's web build of Worklets
// has none and throws after the suite ends. There is no UI runtime to bind.
jest.mock(
  "react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings",
  () => ({ installUIRuntimeBindings: () => undefined }),
);
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () =>
  require("~/test/swipeable"),
);
jest.mock("react-native-reorderable-list", () =>
  require("~/test/reorderable-list"),
);

// Local notifications (`~/lib/notifications`): granted by default; tests
// read and script these spies.
jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
  })),
  scheduleNotificationAsync: jest.fn(async () => "notification-id"),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
}));

// React Native's `Settings` (iOS `UserDefaults`, the playlists Siri reads)
// has no Jest build; the root layout writes it in the route-tree suites.
jest.mock("react-native/Libraries/Settings/NativeSettingsManager", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({ settings: {} }),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
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
