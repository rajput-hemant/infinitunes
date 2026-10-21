import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

/**
 * The show with its seasons. Only the show-level fields are used from it: the
 * episodes of the chosen season and order come from `useShowEpisodes`, so
 * switching either keeps the header and seasons on screen.
 */
export function useShow(token: string) {
  return useQuery({
    ...trpc.show.details.queryOptions({ token }),
  });
}
