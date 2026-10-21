import { fetchLikedSongsNewestFirst } from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";

import { trpcClient } from "~/lib/trpc";

import { useFavoriteIds } from "./use-favorite-ids";
import { useResolvedItems } from "./use-resolved-items";

/** Liked songs, newest like first. */
export function useLikedSongs() {
  return useResolvedItems({
    scope: "liked-songs",
    source: useFavoriteIds("songs"),
    resolve: async (stored) => {
      const songs = await fetchLikedSongsNewestFirst(stored, (input) =>
        trpcClient.song.details.query(input),
      );
      return songs?.map(toSongRow);
    },
  });
}
