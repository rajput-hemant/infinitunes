import type { Episode, Show, Sort, SongRowItem } from "@infinitunes/types";
import { toSongRow } from "@infinitunes/types";

import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";

/** The season's episode count: its own entry in `seasons`, else the show's total. */
function seasonEpisodeTotal(show: Show, season: number): number {
  const entry = show.seasons.find(
    (candidate) => Number(candidate.more_info.season_number) === season,
  );
  return Number(
    entry?.more_info.numEpisodes ?? show.show_details.more_info.total_episodes,
  );
}

const episodeItems = (page: Episode[]) => page.map(toSongRow);
const episodeKey = (row: SongRowItem) => row.id;

type ShowEpisodesOptions = { show: Show; season: number; sort: Sort };

/**
 * One season's episodes in the chosen order, paged from page 1 until the
 * season's count is reached (or, as for every list, a page comes back empty:
 * upstream answers an empty list past the end).
 */
export function useShowEpisodes({ show, season, sort }: ShowEpisodesOptions) {
  const id = show.show_details.id;
  const total = seasonEpisodeTotal(show, season);

  return useInfiniteList<Episode[], SongRowItem>({
    queryKey: [...trpc.show.episodes.pathKey(), { id, season, sort }],
    fetchPage: (page) =>
      trpcClient.show.episodes.query({ id, season, page, sort }),
    itemsOf: episodeItems,
    hasMore: (_lastPage, pages) =>
      !Number.isFinite(total) ||
      pages.reduce((count, page) => count + page.length, 0) < total,
    keyOf: episodeKey,
  });
}
