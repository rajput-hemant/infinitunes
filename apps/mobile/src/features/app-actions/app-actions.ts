import { getErrorCode } from "@infinitunes/core/error-code";
import { userMessage } from "@infinitunes/core/user-message";
import { toSongRow } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";
import { toast } from "sonner-native";

import { queryClient } from "~/lib/query-client";
import { fetchLikedSongRows, fetchSongRows } from "~/lib/song-rows";
import { trpcClient } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";
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
export type ActionOutcome = "player" | "back";

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
): Promise<ActionOutcome> {
  if (!userId) {
    promptSignIn("You need an account to play your liked songs.");
    return "back";
  }
  const rows = await likedSongs(userId);
  if (rows.length === 0) {
    toast("No liked songs yet", {
      description: "Tap the heart on any song and it will show up here.",
    });
    return "back";
  }
  if (shuffle) shuffleAll(rows);
  else playAll(rows);
  return "player";
}

async function playPlaylist(
  userId: string | undefined,
  id: string | undefined,
): Promise<ActionOutcome> {
  if (!userId) {
    promptSignIn("You need an account to play your playlists.");
    return "back";
  }
  const playlists = await queryClient.fetchQuery(serverPlaylistsQuery(userId));
  const playlist = playlists.find((candidate) => candidate.id === id);
  if (!playlist) {
    toast.error("Couldn't find that playlist");
    return "back";
  }
  if (playlist.songs.length === 0) {
    toast(`"${playlist.name}" has no songs yet`);
    return "back";
  }
  const rows = await fetchSongRows(playlist.songs);
  if (!rows) throw new Error("Couldn't load this playlist's songs");
  if (rows.length === 0) {
    toast("These songs are no longer available");
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

async function playSearch(q: string | undefined): Promise<ActionOutcome> {
  const term = q?.trim();
  if (!term) {
    toast.error("Say what to play");
    return "back";
  }
  const song = await topSong(term);
  if (!song) {
    toast(`No songs found for "${term}"`);
    return "back";
  }
  playAll([toSongRow(song)]);
  return "player";
}

function perform(
  action: AppAction,
  { userId, id, q }: AppActionContext,
): ActionOutcome | Promise<ActionOutcome> {
  switch (action) {
    case "resume":
      return resume();
    case "play-liked":
      return playLiked(userId, false);
    case "shuffle-liked":
      return playLiked(userId, true);
    case "play-playlist":
      return playPlaylist(userId, id);
    case "play-search":
      return playSearch(q);
  }
}

/**
 * Runs one app action. Failures toast and land `back`; nothing throws, so
 * the action screen only navigates on the outcome.
 */
export async function runAppAction(
  action: AppAction,
  context: AppActionContext,
): Promise<ActionOutcome> {
  try {
    return await perform(action, context);
  } catch (error) {
    toast.error(userMessage(error));
    return "back";
  }
}
