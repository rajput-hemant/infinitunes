import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

/** A song's lyrics, kept for the session; shared by the hook and the playback prefetch. */
export function lyricsQueryOptions(id: string) {
  return {
    ...trpc.song.syncedLyrics.queryOptions({ id }),
    staleTime: Infinity,
  };
}

export function useLyrics(id: string, enabled = true) {
  return useQuery({ ...lyricsQueryOptions(id), enabled });
}
