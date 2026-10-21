import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

/** The episode behind a perma token; its season and order only matter for a show page. */
export function useEpisode(token: string) {
  return useQuery({
    ...trpc.show.episodeDetails.queryOptions({
      token,
      season: 1,
      sort: "desc",
    }),
  });
}
