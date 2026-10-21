import { toSongRow } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";

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
  (shuffle ? shuffleAll : playAll)(songs.map(toSongRow));
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
    toast.error("Couldn't load songs");
  }
}
