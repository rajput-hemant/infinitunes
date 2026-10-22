import { useQuery } from "@tanstack/react-query";

import { entityQueries } from "~/lib/entity-queries";

export function useArtist(token: string) {
  return useQuery(entityQueries.artist(token));
}
