import type { Episode, MediaType, Song, SongRowItem } from "@infinitunes/types";
import { parseToken, toSongRow } from "@infinitunes/types";

import { showFailure } from "~/lib/failure";
import { trpcClient } from "~/lib/trpc";
import { stationRef } from "~/navigation/entity-href";

import { playAll, shuffleAll } from "./play-collection";
import { beginPlaybackRequest } from "./playback-request";
import { playerStore } from "./player-store";
import { playStation } from "./radio";

/** Types a card's Play button can queue (the web's `PlayButton`). */
const PLAYABLE_TYPES = [
  "song",
  "album",
  "playlist",
  "mix",
  "artist",
  "label",
  "show",
  "episode",
  "radio_station",
] as const satisfies readonly MediaType[];

export type PlayableType = (typeof PLAYABLE_TYPES)[number];

export function isPlayable(type: MediaType): type is PlayableType {
  return PLAYABLE_TYPES.some((playable) => playable === type);
}

function listOf(value: unknown): Song[] {
  return Array.isArray(value) ? value : [];
}

/** The tracks behind a catalog item, fetched by its token as the web does. */
async function tracksOf(
  type: Exclude<PlayableType, "radio_station">,
  token: string,
): Promise<(Song | Episode)[]> {
  switch (type) {
    case "song":
      return (await trpcClient.song.details.query({ token })).songs;
    case "album":
      return listOf((await trpcClient.album.details.query({ token })).list);
    case "playlist":
      return listOf((await trpcClient.playlist.details.query({ token })).list);
    case "mix":
      return listOf((await trpcClient.get.mix.query({ token })).list);
    case "artist":
      return (await trpcClient.artist.details.query({ token })).topSongs ?? [];
    case "label":
      return (await trpcClient.get.label.query({ token })).topSongs.songs;
    case "show":
      return (await trpcClient.show.details.query({ token })).episodes;
    case "episode":
      return (await trpcClient.show.episodeDetails.query({ token })).episodes;
  }
}

/**
 * Plays a catalog item from its card (album, playlist, artist, show,
 * station...): fetches its tracks and replaces the queue, or plays the
 * station. A failure shows in the snackbar (with Retry) unless a newer play
 * replaced it; nothing throws, so a handler can `void` it.
 */
export async function playEntity(
  type: PlayableType,
  url: string,
  options: { shuffle?: boolean } = {},
) {
  const isCurrent = beginPlaybackRequest();
  if (type === "radio_station") {
    const station = stationRef(url);
    if (station) await playStation(station);
    return;
  }
  let tracks: (Song | Episode)[];
  try {
    tracks = await tracksOf(type, parseToken(url));
  } catch {
    if (isCurrent()) {
      showFailure("Couldn't play this.", {
        label: "Retry",
        onPress: () => void playEntity(type, url, options),
      });
    }
    return;
  }
  if (!isCurrent()) return;
  const rows = tracks.map(toSongRow);
  if (options.shuffle) shuffleAll(rows);
  else playAll(rows);
}

/**
 * The songs of an album, playlist or mix as rows, for the card menu's "Add to
 * Playlist". `undefined` after a failure, which has shown in the snackbar.
 */
export async function songsOfEntity(
  type: QueueableType,
  url: string,
): Promise<SongRowItem[] | undefined> {
  try {
    const tracks = await tracksOf(type, parseToken(url));
    return tracks.map(toSongRow).filter((row) => row.type === "song");
  } catch {
    showFailure("Couldn't load this.");
    return undefined;
  }
}

/** Types whose tracks can be queued (a station has no fixed list). */
export type QueueableType = Exclude<PlayableType, "radio_station">;

/**
 * Queues a catalog item's tracks right after the current one (`next`) or at
 * the end (`last`), from its card's menu. A failure shows in the snackbar.
 */
export async function queueEntity(
  type: QueueableType,
  url: string,
  position: "next" | "last",
) {
  let tracks: (Song | Episode)[];
  try {
    tracks = await tracksOf(type, parseToken(url));
  } catch {
    showFailure("Couldn't add this to the queue.");
    return;
  }
  if (tracks.length === 0) return;
  playerStore.getState().addMany(tracks.map(toSongRow), position);
}
