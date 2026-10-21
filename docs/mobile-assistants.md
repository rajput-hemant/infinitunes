# Voice assistants and launcher shortcuts (mobile)

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
