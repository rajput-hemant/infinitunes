import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

import { retryTransient } from "./detail-query";

/** Songs and albums the payload carries: the Overview's rows, the Play queue and the albums shelf. */
const INITIAL_ITEMS = 50;

export function useArtist(token: string) {
  return useQuery({
    ...trpc.artist.details.queryOptions({
      token,
      n_song: INITIAL_ITEMS,
      n_album: INITIAL_ITEMS,
    }),
    retry: retryTransient,
  });
}
