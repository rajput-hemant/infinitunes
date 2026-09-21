import type {
  AllSearch,
  SearchReturnType,
  TopSearch,
} from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  searchAllInput,
  searchByTypeInput,
  searchTopInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { hasIdentity, isRecord, withDownloadUrl } from "./utils";

export const searchRouter = router({
  top: publicProcedure
    .input(searchTopInput)
    .output(z.custom<TopSearch[]>())
    .query(async () => {
      const result = await api<TopSearch[]>(endpoints.search.top_search, {});
      // Secondary discovery list on the search page.
      return Array.isArray(result) ? result : [];
    }),

  all: publicProcedure
    .input(searchAllInput)
    .output(z.custom<AllSearch>())
    .query(async ({ input }) => {
      const result = await api<AllSearch>(endpoints.search.all, {
        query: { query: input.q },
        isVersion4: false,
      });
      if (!hasIdentity(result, "albums")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No search results found",
        });
      }
      return result as AllSearch;
    }),

  byType: publicProcedure
    .input(searchByTypeInput)
    .output(z.custom<SearchReturnType>())
    .query(async ({ input }) => {
      if (input.type === "podcasts") {
        const result = await api(endpoints.search.more, {
          query: {
            query: input.q,
            p: input.page,
            n: input.n,
            params: JSON.stringify({ type: "podcasts" }),
          },
        });
        attachSearchDownloads(result);
        return result as SearchReturnType;
      }
      const map = {
        songs: endpoints.search.songs,
        albums: endpoints.search.albums,
        playlists: endpoints.search.playlists,
        artists: endpoints.search.artists,
      } as const;
      const result = await api(map[input.type], {
        query: { q: input.q, p: input.page, n: input.n },
      });
      if (input.type === "songs") attachSearchDownloads(result);
      else requireSearchResults(result);
      return result as SearchReturnType;
    }),
});

function requireSearchResults(result: unknown): Record<string, unknown> {
  if (!isRecord(result) || !result.results) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No search results found",
    });
  }
  return result;
}

function attachSearchDownloads(result: unknown): void {
  const payload = requireSearchResults(result);
  if (!Array.isArray(payload.results)) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Unexpected response from upstream",
    });
  }
  payload.results = payload.results.map((item) => withDownloadUrl(item));
}
