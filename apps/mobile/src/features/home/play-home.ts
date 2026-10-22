import { toSongRow } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";

import { trpcClient } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";

/** Plays `songs` as a new queue; nothing plays when there are none. */
function playSongs(songs: readonly Song[], shuffle: boolean) {
  if (songs.length === 0) return;
  (shuffle ? shuffleAll : playAll)(songs.map(toSongRow));
}

/** Like jiosaavn.com: a shuffled batch of trending songs replaces the queue and plays. */
export async function playSurprise() {
  try {
    const trending = await trpcClient.get.trending.query({ type: "song" });
    playSongs(
      trending.filter((item): item is Song => item.type === "song"),
      true,
    );
  } catch {
    // Nothing plays; the Home screen stays as it was.
  }
}
