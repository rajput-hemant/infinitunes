import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

/** Songs and albums the label page lists; the procedure has no further pages in use. */
const ITEMS = 50;

export function useLabel(token: string) {
  return useQuery(
    trpc.get.label.queryOptions({
      token,
      page: 0,
      n_song: ITEMS,
      n_album: ITEMS,
      cat: "popularity",
      sort: "asc",
    }),
  );
}
