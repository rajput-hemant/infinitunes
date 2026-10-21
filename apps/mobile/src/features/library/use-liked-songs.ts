import { fetchLikedSongRows } from "~/lib/song-rows";

import { useFavoriteIds } from "./use-favorite-ids";
import { useResolvedItems } from "./use-resolved-items";

/** Liked songs, newest like first. */
export function useLikedSongs() {
  return useResolvedItems({
    scope: "liked-songs",
    source: useFavoriteIds("songs"),
    resolve: fetchLikedSongRows,
  });
}
