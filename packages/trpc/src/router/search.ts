import { TRPCError } from "@trpc/server";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  searchAllInput,
  searchByTypeInput,
  searchTopInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { withDownloadUrl } from "./utils";

export const searchRouter = router({
  top: publicProcedure.input(searchTopInput).query(async () => {
    const result = await api(endpoints.search.top_search, {});
    if (!Array.isArray(result) || result.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No top searches found",
      });
    }
    return result;
  }),

  all: publicProcedure.input(searchAllInput).query(async ({ input }) => {
    const result = await api(endpoints.search.all, {
      query: { query: input.q },
      isVersion4: false,
    });
    if (!(result as Record<string, unknown>).albums) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No search results found",
      });
    }
    return result;
  }),

  byType: publicProcedure.input(searchByTypeInput).query(async ({ input }) => {
    if (input.type === "podcasts") {
      const result = await api(endpoints.search.more, {
        query: {
          query: input.q,
          p: input.page,
          n: input.n,
          params: JSON.stringify({ type: "podcasts" }),
        },
      });
      const payload = result as { results?: Record<string, unknown>[] };
      if (!payload.results) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No search results found",
        });
      }
      payload.results = payload.results.map(withDownloadUrl);
      return result;
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
    const payload = result as { results?: Record<string, unknown>[] };
    if (!payload.results) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No search results found",
      });
    }
    if (input.type === "songs") {
      payload.results = payload.results.map(withDownloadUrl);
    }
    return result;
  }),
});
