// Copied into the app target by `plugins/ios-app-intents/app.plugin.ts`.
// Edit it there: `ios/` is generated.

import AppIntents
import Foundation

/// The App Shortcuts Siri, Spotlight and the Shortcuts app offer without any
/// setup. Every phrase names the app (`\(.applicationName)`), as App
/// Shortcuts require; a phrase without the intent's parameter makes Siri ask
/// for it (its `requestValueDialog`). At most 10 shortcuts per app.
struct InfinitunesShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: PlayLikedSongsIntent(),
      phrases: [
        "Play my liked songs in \(.applicationName)",
        "Play my favorite songs in \(.applicationName)",
        "Play my favorites in \(.applicationName)",
      ],
      shortTitle: "Play Liked Songs",
      systemImageName: "heart.fill"
    )
    AppShortcut(
      intent: ShuffleLikedSongsIntent(),
      phrases: [
        "Shuffle my liked songs in \(.applicationName)",
        "Shuffle my favorites in \(.applicationName)",
      ],
      shortTitle: "Shuffle Liked Songs",
      systemImageName: "shuffle"
    )
    AppShortcut(
      intent: ResumeIntent(),
      phrases: [
        "Resume \(.applicationName)",
        "Continue playing in \(.applicationName)",
        "Pick up where I left off in \(.applicationName)",
      ],
      shortTitle: "Resume",
      systemImageName: "play.fill"
    )
    AppShortcut(
      intent: PlayPlaylistIntent(),
      phrases: [
        "Play \(\.$playlist) in \(.applicationName)",
        "Play my playlist \(\.$playlist) in \(.applicationName)",
        "Play a playlist in \(.applicationName)",
      ],
      shortTitle: "Play Playlist",
      systemImageName: "music.note.list"
    )
    AppShortcut(
      intent: PlaySearchIntent(),
      phrases: [
        "Play a song in \(.applicationName)",
        "Play something in \(.applicationName)",
      ],
      shortTitle: "Play a Song",
      systemImageName: "music.note"
    )
    AppShortcut(
      intent: SearchIntent(),
      phrases: [
        "Search \(.applicationName)",
        "Search in \(.applicationName)",
      ],
      shortTitle: "Search",
      systemImageName: "magnifyingglass"
    )
  }
}

/// Keeps the parameterized phrase ("Play Road Trip in Infinitunes") in step
/// with the playlists JS shares: Siri only matches values it was told about
/// through `updateAppShortcutParameters()`. Started once from
/// `AppDelegate.application(_:didFinishLaunchingWithOptions:)` (the plugin
/// adds the call), since nothing else in the app target runs at launch.
final class AssistantShortcuts: NSObject {
  private static let shared = AssistantShortcuts()
  private static var started = false

  /// Read and written on the main queue only.
  private var playlists = PlaylistStore.playlists()

  static func start() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard !started else { return }
    started = true
    InfinitunesShortcuts.updateAppShortcutParameters()
    NotificationCenter.default.addObserver(
      shared,
      selector: #selector(AssistantShortcuts.defaultsDidChange),
      name: UserDefaults.didChangeNotification,
      object: UserDefaults.standard
    )
  }

  /// Posted on the thread that wrote the defaults (React Native's module queue).
  @objc private func defaultsDidChange() {
    DispatchQueue.main.async { self.refreshIfChanged() }
  }

  private func refreshIfChanged() {
    let current = PlaylistStore.playlists()
    guard current != playlists else { return }
    playlists = current
    InfinitunesShortcuts.updateAppShortcutParameters()
  }
}
