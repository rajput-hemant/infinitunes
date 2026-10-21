import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  IOSConfig,
  withAppDelegate,
  withXcodeProject,
  type ConfigPlugin,
} from "expo/config-plugins";

/**
 * Siri and Shortcuts (App Shortcuts): compiles the Swift App Intents in
 * `./swift` into the app target. Not a pod or an Expo module: Xcode extracts
 * App Intents metadata (`Metadata.appintents`) only from the app target and
 * from frameworks that declare an `AppIntentsPackage`, never from the static
 * libraries CocoaPods builds. No entitlement or Info.plist key is needed.
 * See `docs/mobile-assistants.md`.
 */

const SWIFT_DIR = path.join(import.meta.dirname, "swift");

/**
 * `AppShortcut(intent:phrases:shortTitle:systemImageName:)` with a title and
 * an SF Symbol is iOS 17 API (its iOS 16 form is deprecated), so the app
 * target needs 17.0; the pods keep their own (lower) targets.
 */
const MIN_DEPLOYMENT_TARGET = "17.0";

/** The line `AppDelegate` gets so Siri learns the playlist names at launch and on change. */
const START_CALL = "AssistantShortcuts.start()";
const LAUNCH_RETURN =
  "return super.application(application, didFinishLaunchingWithOptions: launchOptions)";

function swiftSources() {
  return readdirSync(SWIFT_DIR)
    .filter((name) => name.endsWith(".swift"))
    .toSorted();
}

function versionAtLeast(version: string, minimum: string) {
  const [major = 0, minor = 0] = version.split(".").map(Number);
  const [minMajor = 0, minMinor = 0] = minimum.split(".").map(Number);
  return major > minMajor || (major === minMajor && minor >= minMinor);
}

/** Copies the sources into `ios/<App>/` and adds them to the app target's Sources phase. */
const withIntentSources: ConfigPlugin = (config) =>
  withXcodeProject(config, (mod) => {
    const { projectRoot, platformProjectRoot } = mod.modRequest;
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
    let project = mod.modResults;
    for (const name of swiftSources()) {
      project = IOSConfig.XcodeProjectFile.createBuildSourceFile({
        project,
        nativeProjectRoot: platformProjectRoot,
        filePath: path.join(projectName, name),
        fileContents: readFileSync(path.join(SWIFT_DIR, name), "utf8"),
        overwrite: true,
      });
    }

    const target = project.getTarget("com.apple.product-type.application");
    if (!target) throw new Error("ios-app-intents: no application target");
    const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      target.target.buildConfigurationList,
    );
    for (const [, { buildSettings }] of configurations) {
      const current = String(buildSettings.IPHONEOS_DEPLOYMENT_TARGET ?? "0");
      if (
        !versionAtLeast(
          IOSConfig.XcodeUtils.unquote(current),
          MIN_DEPLOYMENT_TARGET,
        )
      ) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = MIN_DEPLOYMENT_TARGET;
      }
    }
    mod.modResults = project;
    return mod;
  });

/** Starts `AssistantShortcuts` in `didFinishLaunchingWithOptions` (Swift template only). */
const withShortcutsAtLaunch: ConfigPlugin = (config) =>
  withAppDelegate(config, (mod) => {
    const { language, contents } = mod.modResults;
    if (language !== "swift") {
      throw new Error(
        `ios-app-intents: expected a Swift AppDelegate, got ${language}`,
      );
    }
    if (contents.includes(START_CALL)) return mod;
    if (!contents.includes(LAUNCH_RETURN)) {
      throw new Error(
        "ios-app-intents: AppDelegate has no `didFinishLaunchingWithOptions` return to start the shortcuts before",
      );
    }
    mod.modResults.contents = contents.replace(
      LAUNCH_RETURN,
      `// Siri's playlist phrases (ios-app-intents plugin).\n    ${START_CALL}\n    ${LAUNCH_RETURN}`,
    );
    return mod;
  });

const withIosAppIntents: ConfigPlugin = (config) =>
  withShortcutsAtLaunch(withIntentSources(config));

export default withIosAppIntents;
