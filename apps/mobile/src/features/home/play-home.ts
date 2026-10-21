import { parseToken, toSongRow } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";
import { playerStore } from "~/playback/player-store";

/** Plays `songs` as a new queue, or says why nothing played; the radio session ends. */
function playSongs(
  songs: readonly Song[],
  emptyMessage: string,
  shuffle: boolean,
) {
  if (songs.length === 0) {
    toast.error(emptyMessage);
    return;
  }
  playerStore.getState().playTracks(songs.map(toSongRow), { shuffle });
}

/** Plays a playlist from its perma URL; failures toast, nothing throws. */
export async function playPlaylist(url: string) {
  try {
    const playlist = await trpcClient.playlist.details.query({
      token: parseToken(url),
    });
    playSongs(
      Array.isArray(playlist.list) ? playlist.list : [],
      "Nothing to play here yet.",
      false,
    );
  } catch {
    toast.error("Couldn't load songs");
  }
}

/** Like jiosaavn.com: a shuffled batch of trending songs replaces the queue and plays. */
export async function playSurprise() {
  try {
    const trending = await trpcClient.get.trending.query({ type: "song" });
    playSongs(
      trending.filter((item): item is Song => item.type === "song"),
      "No songs found right now",
      true,
    );
  } catch {
    toast.error("Failed to load songs");
  }
}
