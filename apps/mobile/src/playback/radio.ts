import { decode, toSongRow } from "@infinitunes/types";
import type {
  RadioType,
  SongRowItem,
  StationDetailsResponse,
} from "@infinitunes/types";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";
import type { StationRef } from "~/navigation/entity-href";

import { playerStore } from "./player-store";

/** Songs asked for when a seeded station starts, as on the web. */
const SEED_BATCH = 20;

/**
 * Plays a loaded station's songs from `startIndex` and marks the queue as
 * radio, so the playback controller keeps appending songs as it runs out.
 */
export function startStation(
  { station, stationId, songs }: StationDetailsResponse,
  startIndex = 0,
) {
  if (songs.length === 0) {
    toast.error("No songs found for this station");
    return;
  }
  playerStore.getState().playTracks(songs.map(toSongRow), {
    startIndex,
    radio: {
      stationId,
      name: decode(station.title),
      type: "featured",
      language: station.more_info.language,
    },
  });
}

/** Loads a featured station and plays it; failures toast, nothing throws. */
export async function playStation({ name, token }: StationRef) {
  try {
    startStation(await trpcClient.radio.stationDetails.query({ name, token }));
  } catch {
    toast.error("Couldn't load this station");
  }
}

export type RadioSeed = {
  /** The artist's or the song's name; the station is called "<name> Radio". */
  name: string;
  /** Seeds an artist station; without it a featured station is made from the name. */
  artistId?: string;
  language?: string;
};

type SeedTrack = Pick<SongRowItem, "name" | "artists"> & {
  primaryArtists?: SongRowItem["primaryArtists"];
  language?: string;
};

/**
 * The web's radio seed for a song or a collection: an artist station from
 * the (first) track's primary artist, else a featured station named after
 * the song or the collection.
 */
export function radioSeedOf(
  tracks: readonly SeedTrack[],
  fallbackName = tracks[0]?.name ?? "",
): RadioSeed {
  const [first] = tracks;
  const artist = (first?.primaryArtists ?? first?.artists)?.[0];
  return artist
    ? { name: artist.name, artistId: artist.id, language: first?.language }
    : { name: fallbackName, language: first?.language };
}

/**
 * Creates a station seeded by an artist or a name (the "Play Radio" action of
 * song and artist menus) and plays it; failures toast, nothing throws.
 */
export async function startSeededRadio({
  name,
  artistId,
  language,
}: RadioSeed) {
  const type: RadioType = artistId ? "artist" : "featured";
  try {
    const { stationId } = await trpcClient.radio.createStation.mutate({
      type,
      name,
      artistId,
      language,
    });
    const songs = await trpcClient.radio.songs.query({
      stationId,
      k: SEED_BATCH,
    });
    if (songs.length === 0) {
      toast.error("Couldn't find songs for this station");
      return;
    }
    playerStore.getState().playTracks(songs.map(toSongRow), {
      radio: { stationId, name: `${name} Radio`, type },
    });
  } catch {
    toast.error("Couldn't start this station");
  }
}
