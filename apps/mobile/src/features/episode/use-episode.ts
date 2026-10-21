import type { EpisodeDetail } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

/** Upstream answers an unknown token with no episode in the list: `null`, as not found. */
function firstEpisode({ episodes, modules }: EpisodeDetail) {
  const [episode] = episodes;
  return episode ? { episode, modules } : null;
}

/** The episode behind a perma token; its season and order only matter for a show page. */
export function useEpisode(token: string) {
  return useQuery({
    ...trpc.show.episodeDetails.queryOptions({
      token,
      season: 1,
      sort: "desc",
    }),
    select: firstEpisode,
  });
}
