import { NATIVE_APP_SCHEME } from "@infinitunes/auth/native-app";
import type { ExpoConfig } from "expo/config";

// Node loads this file without a bundler, so the import names its extension.
import { colors } from "./src/theme/tokens.ts";

const ICON = "./assets/icon.png";

const config: ExpoConfig = {
  name: "Infinitunes",
  slug: "infinitunes",
  scheme: NATIVE_APP_SCHEME,
  version: "0.1.0",
  orientation: "portrait",
  icon: ICON,
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.infinitunes.app",
    supportsTablet: true,
  },
  android: {
    package: "com.infinitunes.app",
    adaptiveIcon: {
      foregroundImage: ICON,
      backgroundColor: colors.dark.background,
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
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
        image: ICON,
        imageWidth: 120,
        backgroundColor: colors.light.background,
        dark: { image: ICON, backgroundColor: colors.dark.background },
      },
    ],
    "./plugins/ios-app-intents/app.plugin.ts",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
