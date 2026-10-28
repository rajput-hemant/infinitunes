import { getQueryClient } from "~/components/query-scope";
import { trpc } from "~/lib/trpc/vanilla";

export function lyricsQueryOptions(id: string) {
  return {
    queryKey: ["syncedLyrics", id],
    queryFn: () => trpc.song.syncedLyrics.query({ id }),
    retry: false,
    staleTime: Infinity,
  };
}

export function prefetchLyrics(ids: string[]) {
  return Promise.all(
    ids.map((id) => getQueryClient().prefetchQuery(lyricsQueryOptions(id))),
  );
}
