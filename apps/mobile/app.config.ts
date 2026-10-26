import { NATIVE_APP_ID, NATIVE_APP_SCHEME } from "@infinitunes/auth/native-app";
import type { ExpoConfig } from "expo/config";

// Node loads this file without a bundler, so the import names its extension.
import { buildIosQuickActions } from "./plugins/ios-quick-actions.ts";
import { colors } from "./src/theme/tokens.ts";

// PNGs come from `bun run mobile:icons` (assets/brand/*.svg).
const ICON = "./assets/icon.png";
const SPLASH = "./assets/splash-icon.png";

// Passkeys need the web domain (the server's RP ID, its auth URL's host) as an
// associated domain, which only an https API can be.
const api = URL.parse(process.env.EXPO_PUBLIC_API_URL ?? "");
const passkeyDomain = api?.protocol === "https:" ? api.hostname : undefined;

// Sign in with Apple and Associated Domains need a paid Apple Developer team:
// a free Apple ID cannot sign them, so builds leave both out unless told.
const applePaidTeam = process.env.EXPO_PUBLIC_APPLE_PAID_TEAM === "true";

// Google's iOS SDK opens its sign-in through the iOS client's reversed id.
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleIosUrlScheme = googleIosClientId?.split(".").toReversed().join(".");

const config: ExpoConfig = {
  name: "Infinitunes",
  slug: "infinitunes",
  scheme: NATIVE_APP_SCHEME,
  version: "0.1.0",
  orientation: "portrait",
  icon: ICON,
  userInterfaceStyle: "automatic",
  ios: {
    icon: {
      light: ICON,
      dark: "./assets/icon-dark.png",
      tinted: "./assets/icon-tinted.png",
    },
    bundleIdentifier: NATIVE_APP_ID,
    usesAppleSignIn: applePaidTeam,
    ...(applePaidTeam &&
      passkeyDomain && {
        associatedDomains: [`webcredentials:${passkeyDomain}`],
      }),
    supportsTablet: true,
    infoPlist: {
      // The dev client's floating "Tools" button covers the header buttons.
      EXDevMenuShowFloatingActionButton: false,
    },
  },
  android: {
    package: NATIVE_APP_ID,
    // Back previews the screen it returns to (`enableOnBackInvokedCallback`).
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-foreground.png",
      backgroundImage: "./assets/adaptive-background.png",
      monochromeImage: "./assets/adaptive-monochrome.png",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    ...(applePaidTeam ? ["expo-apple-authentication"] : []),
    ...(googleIosUrlScheme
      ? [
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: googleIosUrlScheme },
          ] as [string, unknown],
        ]
      : []),
    "expo-sharing",
    "expo-localization",
    "expo-sqlite",
    [
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: SPLASH,
        imageWidth: 200,
        backgroundColor: colors.light.background,
        dark: { image: SPLASH, backgroundColor: colors.dark.background },
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        // The brand teal (`brand` in src/lib/notifications.ts; that module
        // imports native code Node cannot load, so the value is repeated).
        color: "#067f9a",
        // Local notifications only: no push entitlement, no token.
        enableRemoteNotifications: false,
      },
    ],
    ["expo-quick-actions", { iosActions: buildIosQuickActions() }],
    "./plugins/android-app-actions/index.ts",
    "./plugins/android-kotlin-target/index.ts",
    "./plugins/dev-menu-no-fab.ts",
    "./plugins/ios-app-intents/app.plugin.ts",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
