import type { Episode, MediaType, Song } from "@infinitunes/types";
import { parseToken, toSongRow } from "@infinitunes/types";

import { trpcClient } from "~/lib/trpc";
import { stationRef } from "~/navigation/entity-href";

import { playAll } from "./play-collection";
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
 * station. Failures are silent; nothing throws, so a handler can `void` it.
 */
export async function playEntity(type: PlayableType, url: string) {
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
    return;
  }
  if (!isCurrent() || tracks.length === 0) return;
  playAll(tracks.map(toSongRow));
}

/** Types whose tracks can be queued (a station has no fixed list). */
export type QueueableType = Exclude<PlayableType, "radio_station">;

/**
 * Queues a catalog item's tracks right after the current one (`next`) or at
 * the end (`last`), from its card's menu. Failures are silent, as `playEntity`.
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
    return;
  }
  if (tracks.length === 0) return;
  const rows = tracks.map(toSongRow);
  const { playNext, addToQueue } = playerStore.getState();
  // Each insert lands right after the current track, so insert backwards.
  if (position === "next") for (const row of rows.toReversed()) playNext(row);
  else for (const row of rows) addToQueue(row);
}
