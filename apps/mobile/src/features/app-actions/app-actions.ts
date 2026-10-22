import { getErrorCode } from "@infinitunes/core/error-code";
import { toSongRow } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";

import { reportFailure, showFailure } from "~/lib/failure";
import { queryClient } from "~/lib/query-client";
import { clearSongCache } from "~/lib/song-cache";
import { fetchLikedSongRows, fetchSongRows } from "~/lib/song-rows";
import { trpcClient } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";
import { beginPlaybackRequest } from "~/playback/playback-request";
import { playerStore } from "~/playback/player-store";
import { resumePlayback } from "~/playback/transport";
import { favoriteListsQuery } from "~/user-data/favorites";
import { serverPlaylistsQuery } from "~/user-data/playlists";
import { promptSignIn } from "~/user-data/session";

/**
 * The `infinitunes://action/<name>` links Siri (App Shortcuts) and Google
 * Assistant (App Actions) open. The names and their params are a contract
 * with the native sides (`plugins/ios-app-intents`, `plugins/android-*`):
 * rename nothing here without them.
 */
export const APP_ACTIONS = [
  "resume",
  "clear-cache",
  "play-liked",
  "shuffle-liked",
  "play-playlist",
  "play-search",
] as const;

export type AppAction = (typeof APP_ACTIONS)[number];

export function isAppAction(name: unknown): name is AppAction {
  return APP_ACTIONS.some((action) => action === name);
}

export type AppActionContext = {
  /** The signed-in listener, `undefined` when signed out (the session has loaded). */
  userId: string | undefined;
  /** `play-playlist`'s user playlist id. */
  id?: string;
  /** `play-search`'s search term. */
  q?: string;
};

/** Where the app lands after an action: the player once something plays, else back. */
export type ActionOutcome = "player" | "back" | "home";

/** Starts the restored queue, or plays the paused one on; `back` when nothing is queued. */
function resume(): ActionOutcome {
  const { queue, started, start } = playerStore.getState();
  if (queue.length === 0) return "back";
  if (started) resumePlayback();
  else start();
  return "player";
}

async function likedSongs(userId: string): Promise<SongRowItem[]> {
  const lists = await queryClient.fetchQuery(favoriteListsQuery(userId));
  if (lists.songs.length === 0) return [];
  const rows = await fetchLikedSongRows(lists.songs);
  if (!rows) throw new Error("Couldn't load your liked songs");
  return rows;
}

async function playLiked(
  userId: string | undefined,
  shuffle: boolean,
  isCurrent: () => boolean,
): Promise<ActionOutcome> {
  if (!userId) {
    promptSignIn();
    return "back";
  }
  const rows = await likedSongs(userId);
  if (!isCurrent()) return "back";
  if (rows.length === 0) {
    showFailure("You haven't liked any songs yet");
    return "back";
  }
  if (shuffle) shuffleAll(rows);
  else playAll(rows);
  return "player";
}

async function playPlaylist(
  userId: string | undefined,
  id: string | undefined,
  isCurrent: () => boolean,
): Promise<ActionOutcome> {
  if (!userId) {
    promptSignIn();
    return "back";
  }
  const playlists = await queryClient.fetchQuery(serverPlaylistsQuery(userId));
  if (!isCurrent()) return "back";
  const playlist = playlists.find((candidate) => candidate.id === id);
  if (!playlist) {
    showFailure("That playlist isn't in your library");
    return "back";
  }
  const rows =
    playlist.songs.length === 0 ? [] : await fetchSongRows(playlist.songs);
  if (!isCurrent()) return "back";
  if (!rows) throw new Error("Couldn't load this playlist's songs");
  if (rows.length === 0) {
    showFailure(`${playlist.name} has no songs to play`);
    return "back";
  }
  playAll(rows);
  return "player";
}

/** The top song for `q`; `undefined` when nothing matched (upstream says NOT_FOUND or nothing). */
async function topSong(q: string) {
  try {
    const { results } = await trpcClient.search.byType.query({
      q,
      type: "songs",
      page: 1,
      n: 1,
    });
    const [song] = results;
    return song?.type === "song" ? song : undefined;
  } catch (error) {
    if (getErrorCode(error) === "NOT_FOUND") return undefined;
    throw error;
  }
}

async function playSearch(
  q: string | undefined,
  isCurrent: () => boolean,
): Promise<ActionOutcome> {
  const term = q?.trim();
  if (!term) {
    showFailure("Say a song, artist or album to play");
    return "back";
  }
  const song = await topSong(term);
  if (!isCurrent()) return "back";
  if (!song) {
    showFailure(`No songs found for “${term}”`);
    return "back";
  }
  playAll([toSongRow(song)]);
  return "player";
}

function perform(
  action: AppAction,
  { userId, id, q }: AppActionContext,
  isCurrent: () => boolean,
): ActionOutcome | Promise<ActionOutcome> {
  switch (action) {
    case "clear-cache":
      return clearSongCache().then(() => "home" as const);
    case "resume":
      return resume();
    case "play-liked":
      return playLiked(userId, false, isCurrent);
    case "shuffle-liked":
      return playLiked(userId, true, isCurrent);
    case "play-playlist":
      return playPlaylist(userId, id, isCurrent);
    case "play-search":
      return playSearch(q, isCurrent);
  }
}

/**
 * Runs one app action. Failures and empty results land `back` with a snackbar; nothing throws, so the action
 * screen only navigates on the outcome.
 */
export async function runAppAction(
  action: AppAction,
  context: AppActionContext,
): Promise<ActionOutcome> {
  const isCurrent =
    action === "clear-cache" ? () => true : beginPlaybackRequest();
  try {
    return await perform(action, context, isCurrent);
  } catch (error) {
    if (isCurrent()) {
      reportFailure("Couldn't finish that. Try again in the app.")(error);
    }
    return "back";
  }
}
