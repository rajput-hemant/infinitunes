import { NATIVE_APP_SCHEME } from "@infinitunes/auth/native-app";
import type { ExpoConfig } from "expo/config";

// Node loads this file without a bundler, so the import names its extension.
import { colors } from "./src/theme/tokens.ts";

// PNGs come from `bun run mobile:icons` (assets/brand/*.svg).
const ICON = "./assets/icon.png";
const SPLASH = "./assets/splash-icon.png";

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
    bundleIdentifier: "com.infinitunes.app",
    supportsTablet: true,
  },
  android: {
    package: "com.infinitunes.app",
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
