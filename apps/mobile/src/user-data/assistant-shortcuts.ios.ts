import { Settings } from "react-native";

import type { AssistantPlaylist } from "./assistant-shortcuts";

/**
 * The `UserDefaults` key the app's App Intents read the playlists from
 * (`plugins/ios-app-intents/swift/PlaylistEntity.swift`); keep them equal.
 */
const PLAYLISTS_KEY = "InfinitunesAssistantPlaylists";

/**
 * Hands Siri and Shortcuts the listener's playlists ("Play Road Trip in
 * Infinitunes"): React Native's `Settings` writes `UserDefaults.standard`,
 * which the intents (compiled into the app) read in the app's own process.
 * `null` empties them, for a signed-out app: it is written as `[]`, because the
 * TurboModule bridge drops `null` object values, so a removal never lands.
 */
export function shareAssistantPlaylists(
  playlists: readonly AssistantPlaylist[] | null,
) {
  Settings.set({ [PLAYLISTS_KEY]: playlists ?? [] });
}
