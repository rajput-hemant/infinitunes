// Copied into the app target by `plugins/ios-app-intents/app.plugin.ts`.
// Edit it there: `ios/` is generated.

import AppIntents
import UIKit

/// Opens one of the app's own links, which Expo Router handles in JS: the
/// app-action contract shared with Google Assistant
/// (`src/features/app-actions/app-actions.ts`).
///
/// Not `OpenURLIntent`: it opens universal links only, never a custom scheme
/// (Apple DTS, developer.apple.com/forums/thread/762586), and needs iOS 18.
/// Every intent here opens the app first (`openAppWhenRun`, below), so
/// `perform()` runs with the app in the foreground and the system hands the
/// link to the scene delegate, whose Expo subscriber (expo-linking) also keeps
/// it for a cold start that has not loaded JS yet.
@MainActor
enum AppLink {
  /// `infinitunes://<host><path>?<query>`, e.g. `infinitunes://action/resume`.
  static func open(host: String, path: String = "", query: [String: String] = [:]) async {
    var components = URLComponents()
    components.scheme = "infinitunes"
    components.host = host
    components.path = path
    if !query.isEmpty {
      components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
      // `URLComponents` leaves `+` as is, which form decoding reads as a space.
      components.percentEncodedQuery = components.percentEncodedQuery?
        .replacingOccurrences(of: "+", with: "%2B")
    }
    guard let url = components.url else { return }
    _ = await UIApplication.shared.open(url)
  }

  static func action(_ name: String, query: [String: String] = [:]) async {
    await open(host: "action", path: "/\(name)", query: query)
  }
}

struct ResumeIntent: AppIntent {
  static let title: LocalizedStringResource = "Resume Playback"
  static let description: IntentDescription? = IntentDescription("Plays your queue from where you left off.")

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.action("resume")
    return .result()
  }
}

struct PlayLikedSongsIntent: AppIntent {
  static let title: LocalizedStringResource = "Play Liked Songs"
  static let description: IntentDescription? = IntentDescription("Plays the songs you liked, newest first.")

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.action("play-liked")
    return .result()
  }
}

struct ShuffleLikedSongsIntent: AppIntent {
  static let title: LocalizedStringResource = "Shuffle Liked Songs"
  static let description: IntentDescription? = IntentDescription("Plays the songs you liked in a random order.")

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.action("shuffle-liked")
    return .result()
  }
}

struct PlayPlaylistIntent: AppIntent {
  static let title: LocalizedStringResource = "Play Playlist"
  static let description: IntentDescription? = IntentDescription("Plays one of your playlists.")

  @Parameter(title: "Playlist", requestValueDialog: IntentDialog("Which playlist?"))
  var playlist: PlaylistEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Play \(\.$playlist)")
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.action("play-playlist", query: ["id": playlist.id])
    return .result()
  }
}

struct PlaySearchIntent: AppIntent {
  static let title: LocalizedStringResource = "Play a Song"
  static let description: IntentDescription? = IntentDescription("Searches the catalogue and plays the top song.")

  @Parameter(title: "Song", requestValueDialog: IntentDialog("What should I play?"))
  var term: String

  static var parameterSummary: some ParameterSummary {
    Summary("Play \(\.$term)")
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.action("play-search", query: ["q": term])
    return .result()
  }
}

struct SearchIntent: AppIntent {
  static let title: LocalizedStringResource = "Search Infinitunes"
  static let description: IntentDescription? = IntentDescription("Opens Search with your search term.")

  @Parameter(title: "Search Term", requestValueDialog: IntentDialog("What do you want to search for?"))
  var term: String

  static var parameterSummary: some ParameterSummary {
    Summary("Search for \(\.$term)")
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppLink.open(host: "search", query: ["q": term])
    return .result()
  }
}

// Each intent opens the app before `perform()`. `openAppWhenRun` is deprecated
// from iOS 26 in favour of `supportedModes`; this is Apple's documented
// backward-compatible form for intents that run inside the app
// (developer.apple.com/documentation/appintents/appintent/openappwhenrun).
@available(*, deprecated)
extension ResumeIntent {
  static var openAppWhenRun: Bool { true }
}

@available(*, deprecated)
extension PlayLikedSongsIntent {
  static var openAppWhenRun: Bool { true }
}

@available(*, deprecated)
extension ShuffleLikedSongsIntent {
  static var openAppWhenRun: Bool { true }
}

@available(*, deprecated)
extension PlayPlaylistIntent {
  static var openAppWhenRun: Bool { true }
}

@available(*, deprecated)
extension PlaySearchIntent {
  static var openAppWhenRun: Bool { true }
}

@available(*, deprecated)
extension SearchIntent {
  static var openAppWhenRun: Bool { true }
}
