import { AndroidConfig, withAndroidManifest } from "expo/config-plugins";
import type { ConfigPlugin } from "expo/config-plugins";

// The dev client's floating "Tools" button covers the header's action buttons.
// iOS takes the same key from Info.plist (`ios.infoPlist` in app.config.ts).
const withoutDevMenuButton: ConfigPlugin = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      manifestConfig.modResults,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      "EXDevMenuShowFloatingActionButton",
      "false",
    );
    return manifestConfig;
  });

export default withoutDevMenuButton;
