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

## Android (Google Assistant)

Generated at prebuild by the config plugin `apps/mobile/plugins/android-app-actions/` (resource generators in
`shortcuts.ts`, tested by `shortcuts.test.ts`). It writes `res/xml/shortcuts.xml`, shortcut labels into
`values/strings.xml`, spoken-name arrays, vector icons and a small `PlayFromSearchActivity`, and adds
`<meta-data android:name="android.app.shortcuts">` to `MainActivity`. It only emits deep links; the app routes them
(`infinitunes://action/resume`, `action/play-liked`, `action/play-search?q=`, `search?q=`, `library`,
`me/liked-songs`, `me/playlists`, `me/recently-played`, `search`).

### What is wired

| Surface                                                                            | How                                                                           | Deep link                                                                   |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "Open Liked songs / Library / Playlists / Recently played / Search on Infinitunes" | `actions.intent.OPEN_APP_FEATURE`, inline-inventory shortcuts                 | `me/liked-songs`, `library`, `me/playlists`, `me/recently-played`, `search` |
| "Search for \<term\> on Infinitunes"                                               | `actions.intent.GET_THING` (`thing.name` -> `q`)                              | `search?q=<term>`                                                           |
| Long-press launcher icon: Resume, Liked, Search, Library                           | static shortcuts (Playlists and Recent are Assistant-only, `enabled="false"`) | `action/resume`, `me/liked-songs`, `search`, `library`                      |
| "Play \<x\> on Infinitunes" (best effort)                                          | legacy `android.media.action.MEDIA_PLAY_FROM_SEARCH` activity                 | `action/play-search?q=<x>`, or `action/resume` with no query                |

Phrases are the English (en-US and similar) ones: OPEN_APP_FEATURE works in en-\*, es-ES, pt-BR; GET_THING is documented
for en-US and pt-BR only.

### How to test

App Actions are registered with Google when an app is uploaded to Play Console, so:

1. Build a release or debug AAB with the same package name (`com.infinitunes.app`) and upload it to a Play Console
   track (internal testing is enough). A sideloaded build alone is not enough.
2. In Android Studio install the "Google Assistant" plugin, open Tools > Google Assistant > App Actions Test Tool,
   create a preview, pick the BII (OPEN_APP_FEATURE / GET_THING), fill the parameter and run it on a device signed in
   to the same Google account. Inline-inventory previews expire after 6 hours.
3. Launcher shortcuts need no upload: long-press the installed app icon.
4. Without Android Studio, the plain deep links can be checked with
   `adb shell am start -a android.intent.action.VIEW -d "infinitunes://me/liked-songs" com.infinitunes.app` and the
   voice-search trampoline with
   `adb shell am start -a android.media.action.MEDIA_PLAY_FROM_SEARCH --es query "daft punk" com.infinitunes.app`.

### Limitations

- There is no media-play built-in intent in App Actions (the BII catalogue has none for music). "Play X on
  Infinitunes" is Assistant's separate media integration: it connects to the app's `MediaBrowserService` /
  Media3 `MediaLibraryService` session and calls `onPlayFromSearch` / `onPrepareFromSearch` (Android docs,
  "Google Assistant and media apps").
- `expo-audio` 58 runs a Media3 `MediaSessionService` (`AudioControlsService`, lock-screen and notification
  controls) but it is not a `MediaLibraryService`/`MediaBrowserService`, exports no browse root, and its session
  callback implements no `onAddMediaItems` / play-from-search. Assistant therefore cannot drive playback itself:
  at best it launches the app. The `MEDIA_PLAY_FROM_SEARCH` trampoline is the only route, and Assistant on current
  Android versions may not use it. It was not compiled or exercised on a device here.
- Making Assistant search and play natively would need a native media library service (a Media3
  `MediaLibraryService` whose `MediaLibrarySession.Callback` resolves the query through the app's API and hands
  the queue to the JS player, or a native player replacing `expo-audio`) plus the media-actions feed. Forking
  `expo-audio` was ruled out.
- Playing needs the app to open and the JS handler (`action/*` links) to run; a cold start plays only after the
  JS bundle loads.
- The GET_THING capability is generic: Assistant may not route a music search to it.
- Not verified here: no JDK-built APK, Android SDK or device was available, so only the generated resources were
  checked (well-formed XML) and not `processDebugResources`, Play registration or Assistant behaviour.
