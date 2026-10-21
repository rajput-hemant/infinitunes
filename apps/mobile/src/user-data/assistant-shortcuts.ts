/** One playlist as the voice assistant names and opens it. */
export type AssistantPlaylist = { id: string; name: string };

/**
 * Siri reads the playlists from `UserDefaults` (`assistant-shortcuts.ios.ts`).
 * Android's App Actions open `action/play-playlist` links built natively, so
 * there is nothing to share here.
 */
export function shareAssistantPlaylists(
  _playlists: readonly AssistantPlaylist[] | null,
) {}
