# Voice assistants (Siri, Google Assistant)

Both assistants drive the app through the same links, handled once in JS. The native side of each platform only
decides which link to open.

## The app-action links

| Link                                       | What happens                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `infinitunes://action/resume`              | Starts (or plays on) the saved queue and opens the player; with no queue, lands on Home.    |
| `infinitunes://action/play-liked`          | Plays the signed-in listener's liked songs, newest like first.                              |
| `infinitunes://action/shuffle-liked`       | The same, shuffled.                                                                         |
| `infinitunes://action/play-playlist?id=ID` | Plays one of the listener's own playlists (`id` is the database id, not a catalogue token). |
| `infinitunes://action/play-search?q=TERM`  | Searches songs and plays the top result.                                                    |
| `infinitunes://search?q=TERM`              | Opens the Search tab with `TERM` searched.                                                  |

Signed out, the liked-songs and playlist actions show the usual "Sign in to continue" toast; an empty list or no
match shows a toast and the app goes back to where it was (Home on a cold start). An unknown action does the same.
Plain feature links need no action: `/library`, `/me/liked-songs`, `/me/playlists`, `/me/recently-played`, `/search`.

Code: `apps/mobile/src/app/action/[action].tsx` (the route) and `apps/mobile/src/features/app-actions/` (the actions
and their tests). The names and parameters are a contract with the native code below: change them together.

Try a link without an assistant:

```bash
xcrun simctl openurl booted "infinitunes://action/play-liked"            # iOS simulator
adb shell am start -a android.intent.action.VIEW -d "infinitunes://action/play-liked"   # Android
```

## iOS (Siri and Shortcuts)

App Shortcuts, built with the App Intents framework: they work as soon as the app is installed, with no setup in the
Shortcuts app and no Siri entitlement. They also show in Spotlight, the Shortcuts app and the Action button picker.

### What to say

Every phrase must contain the app's name; "Infinitunes" below.

| Say                                                                      | Opens                       |
| ------------------------------------------------------------------------ | --------------------------- |
| "Play my liked songs in Infinitunes", "Play my favorites in Infinitunes" | `action/play-liked`         |
| "Shuffle my liked songs in Infinitunes"                                  | `action/shuffle-liked`      |
| "Resume Infinitunes", "Continue playing in Infinitunes"                  | `action/resume`             |
| "Play Road Trip in Infinitunes" (any playlist name)                      | `action/play-playlist?id=…` |
| "Play a playlist in Infinitunes" (Siri asks which)                       | `action/play-playlist?id=…` |
| "Play a song in Infinitunes" (Siri asks "What should I play?")           | `action/play-search?q=…`    |
| "Search Infinitunes" (Siri asks for the term)                            | `search?q=…`                |

Siri cannot take a free-form song name inside the phrase itself ("Play Tum Hi Ho in Infinitunes"): App Shortcut phrases
only accept parameters with a fixed list of values (an `AppEntity` such as a playlist), so a song is asked for after the
phrase.

### How it is built

- `apps/mobile/plugins/ios-app-intents/` is a config plugin (listed in `app.config.ts`). On prebuild it copies
  `swift/*.swift` into `ios/Infinitunes/` and adds them to the app target's Sources phase. They are not a pod or an Expo
  module on purpose: Xcode extracts App Intents metadata (`Metadata.appintents`, which Siri reads) only from the app
  target and from frameworks declaring an `AppIntentsPackage`, not from the static libraries CocoaPods builds.
- Each intent opens the app (`openAppWhenRun`) and then opens its link with `UIApplication.shared.open`. Not
  `OpenURLIntent`: it only opens universal links, never a custom scheme
  ([Apple DTS](https://developer.apple.com/forums/thread/762586)), and needs iOS 18. The link reaches Expo Router
  through the scene delegate, which expo-linking also records for a cold start.
- Playlists: JS writes the listener's playlist names and ids to `UserDefaults` under `InfinitunesAssistantPlaylists`
  through React Native's built-in `Settings` module (`src/user-data/assistant-shortcuts.ios.ts`, kept in step by
  `AssistantPlaylists` in the root layout; signing out removes them). `PlaylistEntity`'s query reads that key; the
  intents run in the app's own process, so no App Group is needed. The plugin adds `AssistantShortcuts.start()` to
  `AppDelegate`, which calls `updateAppShortcutParameters()` at launch and whenever that key changes, so Siri learns the
  names for "Play <playlist> in Infinitunes".
- The app target's deployment target is raised to iOS 17.0 (pods keep theirs): App Shortcuts with a short title and
  an SF Symbol (`AppShortcut(intent:phrases:shortTitle:systemImageName:)`) are iOS 17 API.

### Test on a device

1. Build a development build (`bun run mobile:ios`, see [mobile-device-setup.md](mobile-device-setup.md)), run it once
   and sign in.
2. Shortcuts app → App Shortcuts → Infinitunes: the six shortcuts should be listed. Tap one to run it.
3. Say a phrase from the table to Siri. New phrases can take a minute to register after install; a playlist name is
   known after the app has loaded your playlists once (open the Library tab).
4. Try each link directly too (`xcrun simctl openurl`, above, or Safari on the device): if a link works but its
   phrase does not, the problem is on the Swift side.

### Limitations

- The Swift sources cannot be compiled on Linux (no Xcode). They are written against Apple's documentation and checked
  by prebuild only (files in the app target's Sources phase, deployment target, `AppDelegate` call): the first macOS
  build is their first compile, and nothing here has run on a device yet.
- Every intent brings the app to the foreground; nothing plays in the background or answers from Siri without opening
  the app.
- Siri recognises phrases in the device language; the phrases are English only (no `AppShortcuts.xcstrings` yet).
- A playlist renamed on another device reaches Siri only after this app has refreshed its playlists.
