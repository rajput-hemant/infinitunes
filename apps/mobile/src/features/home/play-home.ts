import { toSongRow } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";

import { showFailure } from "~/lib/failure";
import { trpcClient } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";
import { beginPlaybackRequest } from "~/playback/playback-request";

/** Plays `songs` as a new queue; nothing plays when there are none. */
function playSongs(songs: readonly Song[], shuffle: boolean) {
  if (songs.length === 0) return;
  (shuffle ? shuffleAll : playAll)(songs.map(toSongRow));
}

/** Like jiosaavn.com: a shuffled batch of trending songs replaces the queue and plays. */
export async function playSurprise() {
  const isCurrent = beginPlaybackRequest();
  try {
    const trending = await trpcClient.get.trending.query({ type: "song" });
    if (!isCurrent()) return;
    playSongs(
      trending.filter((item): item is Song => item.type === "song"),
      true,
    );
  } catch {
    if (!isCurrent()) return;
    showFailure("Couldn't load songs to play.", {
      label: "Retry",
      onPress: () => void playSurprise(),
    });
  }
}
