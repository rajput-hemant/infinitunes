import type { Episode, MediaType, Song } from "@infinitunes/types";
import { parseToken, toSongRow } from "@infinitunes/types";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";
import { stationRef } from "~/navigation/entity-href";

import { playAll } from "./play-collection";
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
 * station. Failures toast; nothing throws, so a handler can `void` it.
 */
export async function playEntity(type: PlayableType, url: string) {
  if (type === "radio_station") {
    const station = stationRef(url);
    if (station) await playStation(station);
    else toast.error("Couldn't load this station");
    return;
  }
  let tracks: (Song | Episode)[];
  try {
    tracks = await tracksOf(type, parseToken(url));
  } catch {
    toast.error("Couldn't load songs");
    return;
  }
  if (tracks.length === 0) {
    toast.error("Nothing to play here yet.");
    return;
  }
  playAll(tracks.map(toSongRow));
}
