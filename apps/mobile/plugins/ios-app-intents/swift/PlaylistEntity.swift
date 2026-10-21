// Copied into the app target by `plugins/ios-app-intents/app.plugin.ts`.
// Edit it there: `ios/` is generated.

import AppIntents
import Foundation

/// The listener's playlists as JS last shared them
/// (`src/user-data/assistant-shortcuts.ios.ts`, React Native's `Settings`):
/// an array of `{ id, name }` dictionaries in `UserDefaults.standard`, absent
/// while signed out. The intents run in the app's own process, so no App
/// Group is needed.
enum PlaylistStore {
  static let key = "InfinitunesAssistantPlaylists"

  static func playlists() -> [PlaylistEntity] {
    let rows = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
    return rows.compactMap { row in
      guard let id = row["id"] as? String, let name = row["name"] as? String else {
        return nil
      }
      return PlaylistEntity(id: id, name: name)
    }
  }
}

struct PlaylistEntity: AppEntity, Equatable {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Playlist"
  static let defaultQuery = PlaylistQuery()

  let id: String
  let name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

struct PlaylistQuery: EntityStringQuery {
  func entities(for identifiers: [PlaylistEntity.ID]) async throws -> [PlaylistEntity] {
    let wanted = Set(identifiers)
    return PlaylistStore.playlists().filter { wanted.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [PlaylistEntity] {
    PlaylistStore.playlists().filter { $0.name.localizedCaseInsensitiveContains(string) }
  }

  /// Also the values Siri learns for "Play <playlist> in Infinitunes"
  /// (`InfinitunesShortcuts.updateAppShortcutParameters()`).
  func suggestedEntities() async throws -> [PlaylistEntity] {
    PlaylistStore.playlists()
  }
}
