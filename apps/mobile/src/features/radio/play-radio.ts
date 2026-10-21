import { decode, toSongRow } from "@infinitunes/types";
import type { RadioType, StationDetailsResponse } from "@infinitunes/types";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";
import { playerStore } from "~/playback/player-store";

import type { StationRef } from "./station-ref";

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
    toast.error("No songs found for this radio station");
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
    toast.error("Failed to load radio station");
  }
}

type RadioSeed = {
  /** The artist's or the song's name; the station is called "<name> Radio". */
  name: string;
  /** Seeds an artist station; without it a featured station is made from the name. */
  artistId?: string;
  language?: string;
};

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
      toast.error("Could not find songs for this radio");
      return;
    }
    playerStore.getState().playTracks(songs.map(toSongRow), {
      radio: { stationId, name: `${name} Radio`, type },
    });
  } catch {
    toast.error("Unable to start radio station");
  }
}
