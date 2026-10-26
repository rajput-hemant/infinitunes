# Run the mobile app on a physical phone

Development build on a real device, no emulator or simulator. Expo Go cannot run this app (native modules, SDK 58).
The phone and the computer must be on the same Wi-Fi (no guest network with client isolation).

## Both platforms

1. Install Node 22.13+ (22.x or 24.3+; `react-native` requires it) and Bun 1.4.3 (`.bun-version`), then `bun install` at the repo root.
2. Start the web app the phone talks to ([database and env setup](local-development.md)): `bun run dev`.
   `next dev` binds all interfaces by default, so it is reachable on the LAN. Allow inbound port 3000 (and 8081 for Metro) in the computer's firewall.
3. Find the computer's LAN IP: macOS `ipconfig getifaddr en0`, Linux `hostname -I`, Windows `ipconfig` (IPv4 Address).
4. Create the env file with that IP:

   ```bash
   cp apps/mobile/.env.example apps/mobile/.env.local
   # apps/mobile/.env.local
   EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000
   ```

Plain `http://` to a LAN address works in development builds: Android debug builds set `usesCleartextTraffic`
(debug manifest only, not release) and the iOS Info.plist has `NSAllowsLocalNetworking`. No config change is needed.

## Android phone (macOS, Linux or Windows)

Installs: JDK 17 and the Android command-line SDK (no Android Studio, no emulator).

1. Install JDK 17 (React Native 0.88 builds with Java 17; Gradle 9.4.1 is downloaded by the wrapper).
2. Install the Android SDK command-line tools, then:

   ```bash
   sdkmanager "platform-tools" "platforms;android-37" "build-tools;37.0.0" "ndk;27.1.12297006"
   ```

   Set `JAVA_HOME` and `ANDROID_HOME` (the SDK folder) and add `$ANDROID_HOME/platform-tools` to `PATH`.
   Gradle can also fetch missing SDK parts if you accept the licenses: `sdkmanager --licenses`.

3. On the phone: Settings > About phone > tap Build number 7 times, then Developer options > turn on USB debugging.
4. Connect with a data-capable USB cable, accept "Allow USB debugging" on the phone, and check `adb devices` shows `device`.
5. Build and install (first build downloads Gradle and compiles native code: slow and several GB of disk):

   ```bash
   bun run mobile:android
   ```

   The script is `expo run:android --device`: it lists connected devices and asks which one to use. Extra flags can follow, e.g. `bun run mobile:android -d "<name>"`.

## iPhone (macOS only)

Installs: Xcode 16.1 or newer (React Native 0.88 minimum; use the newest your Mac allows) and CocoaPods (`brew install cocoapods`).
The app targets iOS 16.4+. Linux and Windows cannot build iOS.

1. Open Xcode once, accept the license, and install the iOS platform when asked. Sign in under Xcode > Settings > Accounts with an Apple ID.
   A free Apple ID works: apps expire after 7 days (rebuild to renew) and the number of apps and devices is limited. A paid Developer account removes this.
2. On the iPhone: Settings > Privacy & Security > Developer Mode > on, then restart and confirm.
3. Connect by USB, tap Trust on the phone.
4. Build and install:

   ```bash
   bun run mobile:ios
   ```

   The script is `expo run:ios --device`: pick the iPhone from the list. If it fails on signing, open `apps/mobile/ios/Infinitunes.xcworkspace` (created by the first run), set your Team under Signing & Capabilities, then rerun the command.
   If `com.infinitunes.app` is taken for a free account, change `ios.bundleIdentifier` locally.

5. First launch: Settings > General > VPN & Device Management > your Apple ID > Trust. Allow the Local Network prompt in the app.

## Daily use

```bash
bun run dev        # web app
bun run dev:mobile # Metro
```

Open the installed Infinitunes app and pick the Metro server it lists (same Wi-Fi). Shake the device for the dev menu to reload.
Rebuild (the `mobile:android` / `mobile:ios` command above) only after a native dependency, config plugin or `app.config.ts` change.
Changing `.env.local` needs a Metro restart: `bun run dev:mobile --clear`.

## If it fails

- `adb devices` shows nothing or `unauthorized`: change cable or port, reconnect, accept the prompt (revoke USB debugging authorisations if it never appears).
- "Network request failed": wrong IP in `.env.local`, firewall blocking 3000 or 8081, different Wi-Fi, or guest-network client isolation.
- Android build errors about Java or the SDK: `java -version` must be 17 and `ANDROID_HOME` must point at the SDK.
- iOS "No profiles" / signing error: set the Team in Xcode as in step 4; `pod install` errors: update CocoaPods.
- Expo Go says the project is incompatible: expected, use the development build.

Not verified from the repo (verify on your machine): the exact Xcode version Expo SDK 58 prefers beyond React Native's 16.1 minimum, and Apple's current free-account app and device limits.
